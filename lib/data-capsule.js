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
    if( old ) {
      item.v$ = old.v$+1
    }

    self.index[item.id] = item

    if( item.index$ && 0 <= item.index$ && item.index$ < self.items.length ) {
      self.items.splice(item.index$, 0, item)
      delete item.index$
    }
    else {
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
    return function(req,res,next,spec,id){
      self.capsule( spec, util.err( res, function( cap ) {
        win( res, cap, id ) 
      }))
    }
  }


  self.api = {}


  self.api.rest = {
    get_one: getcap(function(res,cap,id){
      cap.load(id, util.err( res, function(item) {
        if( item ) {
          util.sendjson(res,item)
        }
        else util.sendcode(res,404)
      }))
    }),

    get_all: getcap(function(res,cap,id){
      cap.list({}, util.err( res, function(items) {
        util.sendjson(res,{items:items})
      }))
    }),

    post:    function(req,res,next){},
    put:     function(req,res,next){},
    del:     function(req,res,next){},
  }


  var routes = {}
  routes[self.opt.prefix] = {
    '/rest/:spec/:id': self.api.rest.get_one,
    '/rest/:spec':     self.api.rest.get_all
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

