"use strict";

var buffer = require('buffer')

var dispatch = require('dispatch')


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


function DataCapsule( opt ) {
  var self = {
    opt: opt || {}
  }

  self.opt.prefix = self.opt.prefix || '/capsule'
  
  var routes = {}
  routes[self.opt.prefix] = {
    '/foo': function(req,res) {
      util.sendjson(res,{a:1})
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

