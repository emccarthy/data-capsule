

var connect  = require('connect')

var DataCapsule = require('../../lib/data-capsule.js')


var dc = new DataCapsule()
dc.capsule( 'foo', function(err,cap){
  cap.save({a:1},function(err,item){
    cap.save({a:2},function(err,item){
      cap.load(item,function(err,item){
        console.log(item)

        cap.list({},function(err,out){
          console.log(out)
        })
      })
    })
  })
})

var server = connect.createServer(
  dc.middleware()
)

server.listen(8181)
