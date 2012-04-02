

var connect  = require('connect')
var uuid     = require('node-uuid')

var DataCapsule = require('./data-capsule.js')

function start() {

  var port = process.env.VCAP_APP_PORT || process.env.PORT || parseInt( process.argv[2], 10 )
  var staticFolder = __dirname + '/../site/public'

  console.log('port='+port+' static='+staticFolder)

  var dc = new DataCapsule({
    makeid:function(item){
      if( item.month ) {
        return item.month+'_'+item.type;
      }
      else {
        return uuid()
      }
    }
  })

  var server = connect.createServer(
    //connect.logger(),
    connect.bodyParser(),

    connect.query(),

    dc.middleware(),

    function(req,res,next){
      if( 0 === req.url.indexOf('/api/ping') ) {
        console.log(req.url+': '+JSON.stringify(req.query))
        res.writeHead(200)
        res.end( JSON.stringify({ok:true,time:new Date()}) )
      }
      else next();
    },

    connect.static( staticFolder )
  )

  server.listen( port )
}

exports.start = start

if( 0 < process.argv[1].indexOf('server.js') ) {
  start()
}

