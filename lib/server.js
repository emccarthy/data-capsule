

var connect  = require('connect')

var DataCapsule = require('./data-capsule.js')


var port = parseInt( process.argv[2], 10 )
var staticFolder = __dirname + '/../site/public'

console.log('port='+port+' static='+staticFolder)

var dc = new DataCapsule()

var server = connect.createServer(
  connect.logger(),
  connect.bodyParser(),

  dc.middleware(),

  function(req,res,next){
    console.log(req.url)
    if( 0 === req.url.indexOf('/api/ping') ) {
      res.writeHead(200)
      res.end( JSON.stringify({ok:true,time:new Date()}) )
    }
    else next();
  },

  connect.static( staticFolder )
)

server.listen( port )
