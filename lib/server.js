

var connect  = require('connect')

var DataCapsule = require('./data-capsule')


var port = parseInt( process.argv[2], 10 )


var dc = new DataCapsule()

var server = connect.createServer(
  connect.logger(),
  connect.bodyParser(),
  dc.middleware()
)

server.listen(port)


