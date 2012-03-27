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



function Capsule( spec ) {
  var self = {}

  self.items = []
  self.index = {}
  self.v = 0

  self.load = function( query, cb ) {
    var id = query
    if( 'string' != typeof(query) ) {
      id = query.id
    }
    cb(null,self.index[id])
  }

  self.save = function( item, cb ) {
    if( !item.id ) {
      item.id = uuid()
      item.v$ = 0
    }

    var old = self.index[item.id]
    var oldindex = -1

    if( old ) {
      item.v$ = old.v$+1
      for( oldindex = 0; oldindex < self.items.length; oldindex++ ) {
        if( self.items[oldindex].id == item.id ) {
          self.items[oldindex] = item
          break
        }
      }
    }

    self.index[item.id] = item

    if( undefined != item.index$ && 0 <= item.index$ && item.index$ < self.items.length ) {
      -1 < oldindex && self.items.splice(oldindex, 1)
      self.items.splice(item.index$, 0, item)
      delete item.index$
    }
    else if(!old) {
      self.items.push(item)
    }

    self.v++
    cb(null,item)
  }

  self.remove = function( item, cb ) {
    var old = self.index[item.id]
    delete self.index[item.id]

    for( var i = 0; i < self.items.length; i++ ) {
      if( self.items[i].id === item.id ) {
        self.items.splice(i, 1)
        break
      }
    }

    if( old ) {
      self.v++
    }

    cb(null,old)
  }

  self.list = function( query, cb ) {
    cb(null,self.items)
  }


  self.meta = function( cb ) {
    cb(null,{version:self.v,length:self.items.length})
  }

  return self
}


function DataCapsule( opt ) {
  var self = {
    opt: opt || {}
  }

  self.opt.prefix = self.opt.prefix || '/capsule'
  
  self.capsulemap = {}



  self.capsule = function( spec, cb ) {
    var cap = self.capsulemap[spec]
    if( !cap ) {
      cap = self.capsulemap[spec] = new Capsule(spec)
    }
    cb(null,cap)
  }


  var getcap = function(win) {
    return function(req,res,next,acc,coll,spec,id){
      console.log(req.url+' '+[acc,coll,spec,id].join(', ')+' body:'+JSON.stringify(req.body))
      var capname = acc+'~'+coll+'~'+spec
      self.capsule( capname, util.err( res, function( cap ) {
        console.log(JSON.stringify(cap.index))
        console.log(JSON.stringify(cap.items))
        win( req, res, cap, id ) 
      }))
    }
  }


  self.api = {}


  self.api.rest = {
    get_one: getcap(function(req,res,cap,id){
      console.log('get='+id)
      cap.load(id, util.err( res, util.found( res, util.senditem(res) )))
    }),

    get_all: getcap(function(req,res,cap){
      cap.list({}, util.err( res, function(items) {
        util.sendjson(res,{items:items})
      }))
    }),


    post: getcap(function(req,res,cap){
      var item = req.body
      if( item.id ) {
        util.sendcode(400,'unexpected id property')
      }
      else {
        console.log('post:'+JSON.stringify(item))
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

