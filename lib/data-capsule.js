"use strict";

var buffer = require('buffer')


var dispatch = require('dispatch')
var uuid     = require('node-uuid')


var util = {}

util.sendjson = function(res,obj) {
  var objstr = JSON.stringify(obj)
  res.writeHead(200,{
    'Content-Type': 'application/json',
    'Cache-Control': 'private, max-age=0, no-cache, no-store',
    "Content-Length": buffer.Buffer.byteLength(objstr) 
  })
  res.end( objstr )
}

util.sendcode = function(res,code,msg) {
  res.writeHead(code,msg)
  res.end()
}

util.err = function( res, win ) {
  return function( err, data ) {
    if( err ) {
      util.sendcode(res, 500)
      console.log(err)
    }
    else {
      win( data ) 
    }
  }
}

util.found = function( res, win ) {
  return function( item ) {
    if( item ) {
      win( item ) 
    }
    else util.sendcode(res, 404)
  }
}

util.senditem = function( res, item ) {
  return function( item ) {
    util.sendjson(res,item)
  }
}



function Capsule( opt ) {
  var self = {}

  var acc  = opt.acc
  var coll = opt.coll
  var spec = opt.spec

  self.items = []
  self.index = {}
  self.v = -1

  self.history = []


  self.load = function( query, cb ) {
    var id = query
    if( 'string' != typeof(query) ) {
      id = query.id
    }
    cb(null,self.index[id])
  }

  self.save = function( item, cb ) {
    if( !item.id ) {
      item.id = (opt.makeid && opt.makeid(item)) || uuid()
      item.v$ = 0

      if( self.items[item.id] ) {
        return cb('id '+item.id+' exists')
      }
    }

    var old = self.index[item.id]

    if( old ) {
      item.v$ = old.v$+1
      for( var i = 0; i < self.items.length; i++ ) {
        if( self.items[i].id == item.id ) {
          self.items[i] = item
          break
        }
      }
      self.history.push({id:item.id,act:'MOD',v:item.v$,sv:self.v})
    }
    else {
      self.items.push(item)
      self.history.push({id:item.id,act:'ADD',v:item.v$,sv:self.v})
    }

    self.index[item.id] = item

    self.v++
    cb(null,item)
  }

  self.remove = function( item, cb ) {
    var old = self.index[item.id]

    if( old ) {
      delete self.index[item.id]

      for( var i = 0; i < self.items.length; i++ ) {
        if( self.items[i].id === item.id ) {
          self.items.splice(i, 1)
          break
        }
      }

      self.history.push({id:item.id,act:'DEL',v:old.v$,sv:self.v})
      self.v++
    }

    cb(null,old)
  }

  self.list = function( query, cb ) {
    var items = []
    for( var i = 0; i < self.items.length; i++ ) {
      var item = self.items[i]

      var match = true
      for( var p in query ) {
        var v = query[p]

        match = (item[p] == v)
        if( !match ) break;
      }

      if( match ) {
        items.push(item)
      }
    }
    cb(null,items)
  }


  self.meta = function( cb ) {
    cb(null,{version:self.v,length:self.items.length,acc:acc,coll:coll,spec:spec})
  }

  return self
}



function DataCapsule( opt ) {
  var self = {
    opt: opt || {}
  }

  self.opt.prefix = self.opt.prefix || '/capsule'
  
  self.capsulemap = {}



  self.capsule = function( acc,coll,spec, cb ) {
    var capname = acc+'~'+coll+'~'+spec
    var cap = self.capsulemap[capname]
    if( !cap ) {
      var capopt = {
        acc:acc,coll:coll,spec:spec,
        makeid:opt.makeid
      }
      cap = self.capsulemap[capname] = new Capsule(capopt)
    }
    cb(null,cap)
  }


  var getcap = function(win) {
    return function(req,res,next,acc,coll,spec,param){
      self.capsule( acc,coll,spec, util.err( res, function( cap ) {
        win( req, res, cap, param ) 
      }))
    }
  }


  self.api = {}


  self.api.rest = {
    get_one: getcap(function(req,res,cap,id){
      cap.load(id, util.err( res, util.found( res, util.senditem(res) )))
    }),

    get_all: getcap(function(req,res,cap){
      var q = req.query
      delete q._
      cap.list(q, util.err( res, function(items) {
        util.sendjson(res,{items:items})
      }))
    }),


    post: getcap(function(req,res,cap){
      var item = req.body
      if( item.id ) {
        util.sendcode(res,400,'unexpected id property')
      }
      else {
        cap.save(item, util.err( res, function(item) {
          util.sendjson(res,item)
        }))
      }
    }),


    put: getcap(function(req,res,cap,id){
      var item = req.body
      item.id = id
      cap.save(item, util.err( res, util.senditem(res) ))
    }),


    del: getcap(function(req,res,cap,id){
      cap.remove({id:id}, util.err( res, util.senditem(res) ))
    }),
  }


  self.api.sync = {
    get_version: getcap(function(req,res,cap){
      cap.meta( util.err( res, function( meta ) {
        util.sendjson(res,meta)
      }))
    }),

    get_updates: getcap(function(req,res,cap,version){
      var from    = parseInt(version,10)
      var history = cap.history.slice(from<0?0:from)

      var updates = {}
      for( var i = 0; i < history.length; i++ ) {
        var h = history[i]
        var prev_act = updates[h.id]
        if( prev_act ) {
          var act = h.act
          if( 'ADD' === act ) {
            if( 'MOD' === prev_act ) { act = 'MOD' }
            if( 'DEL' === prev_act ) { act = 'MOD' }
          }
          else if( 'MOD' === act ) {
            if( 'ADD' === prev_act ) { act = 'ADD' }
            if( 'DEL' === prev_act ) { act = 'MOD' }
          }
          else if( 'DEL' === act ) {
            if( 'ADD' === prev_act ) { act = 'IGNORE' }
          }

          if( 'IGNORE' === act ) {
            delete updates[h.id]
          }
          else {
            updates[h.id] = act
          }
        }
        else {
          updates[h.id] = h.act
        }
      }

      var itemacts = []
      for( var id in updates ) {
        itemacts.push({id:id,act:updates[id]})
      }

      var items = []
      function getitem(i) {
        if( i < itemacts.length ) {
          cap.load(itemacts[i].id, util.err(res,function(item){
            if( item ) {
              items.push({act:itemacts[i].act,item:item})
            }
            getitem(i+1)
          }))
        }
        else {
          util.sendjson(res,{updates:items})
        }
      }
      getitem(0)
    }),

    get_history: getcap(function(req,res,cap,version){
      var from    = parseInt(version,10)
      var history = cap.history.slice(from<0?0:from)
      util.sendjson(res,{history:history})
    })
  }


  var routes = {}
  routes[self.opt.prefix] = {
    '/rest/:acc/:coll/:spec/:id': {
      GET: self.api.rest.get_one,
      PUT: self.api.rest.put,
      DELETE: self.api.rest.del
    },
    '/rest/:acc/:coll/:spec': {
      GET:  self.api.rest.get_all,
      POST: self.api.rest.post
    },
    '/sync/:acc/:coll/:spec/version': {
      GET: self.api.sync.get_version
    },
    '/sync/:acc/:coll/:spec/updates/:version': {
      GET: self.api.sync.get_updates
    },
    '/sync/:acc/:coll/:spec/history/:version': {
      GET: self.api.sync.get_history
    }
  }
  self.dispatch = dispatch(routes)


  self.middleware = function() {
    return function( req, res, next ) {
      if( 0 === req.url.indexOf(self.opt.prefix) ) {
        self.dispatch( req, res, next )
      }
      else next();
    }
  }

  return self
}


module.exports = DataCapsule

