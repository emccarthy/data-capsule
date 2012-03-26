

var connect  = require('connect')

var DataCapsule = require('../../lib/data-capsule.js')


var dc = new DataCapsule()


var server = connect.createServer(
  dc.middleware()
)

server.listen(8181)
