

var connect  = require('connect')

var DataCapsule = require('./data-capsule.js')


var port = parseInt( process.argv[2], 10 )
console.log('port='+port)

var dc = new DataCapsule()

var server = connect.createServer(
  connect.logger(),
  connect.bodyParser(),
  dc.middleware(),
  function(req,res,next){
    if( '/api/ping' == req.url ) {
      res.writeHead(200)
      res.end('ok '+new Date())
    }
    else next();
  }
)

server.listen( port )
