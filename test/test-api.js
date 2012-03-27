
var request = require('request')


var host = process.argv[2]
var port = process.argv[3]

var base = 'http://'+host+':'+port+'/capsule'
console.log(base)

var rest_base = base+'/rest'
var sync_base = base+'/sync'



var printres = function(err,res,body) {
  body = 'string'==typeof(body)?JSON.parse(body):body
  console.log(err+' '+res.statusCode+' '+JSON.stringify(body))
}


function test() {

  console.log('\n\nACTIONS:')

;request.post({uri:rest_base+'/ac1/coll1/foo=bar',json:{b:20}}, function(err,res,body) {
  printres(err,res,body)
  var item = body

;request.post({uri:rest_base+'/ac1/coll1/foo=bar',json:{a:10}}, function(err,res,body) {
  printres(err,res,body)
  var item = body

;request.get({uri:rest_base+'/ac1/coll1/foo=bar/'+item.id}, function(err,res,body) {
  printres(err,res,body)


  console.log('\n\nHISTORY:')

;request.get({uri:sync_base+'/ac1/coll1/foo=bar/version'}, function(err,res,body) {
  printres(err,res,body)

;request.get({uri:sync_base+'/ac1/coll1/foo=bar/history/0'}, function(err,res,body) {
  printres(err,res,body)

;request.get({uri:sync_base+'/ac1/coll1/foo=bar/updates/0'}, function(err,res,body) {
  printres(err,res,body)


  console.log('\n\nACTIONS:')

;request.get({uri:rest_base+'/ac1/coll1/foo=bar'}, function(err,res,body) {
  printres(err,res,body)

;request.put({uri:rest_base+'/ac1/coll1/foo=bar/'+item.id,json:{a:11}}, function(err,res,body) {
  printres(err,res,body)
  var item = body

;request.get({uri:rest_base+'/ac1/coll1/foo=bar'}, function(err,res,body) {
  printres(err,res,body)


  console.log('\n\nHISTORY:')

;request.get({uri:sync_base+'/ac1/coll1/foo=bar/version'}, function(err,res,body) {
  printres(err,res,body)

;request.get({uri:sync_base+'/ac1/coll1/foo=bar/history/0'}, function(err,res,body) {
  printres(err,res,body)

;request.get({uri:sync_base+'/ac1/coll1/foo=bar/updates/0'}, function(err,res,body) {
  printres(err,res,body)

;request.get({uri:sync_base+'/ac1/coll1/foo=bar/updates/1'}, function(err,res,body) {
  printres(err,res,body)

;request.get({uri:sync_base+'/ac1/coll1/foo=bar/updates/2'}, function(err,res,body) {
  printres(err,res,body)


  console.log('\n\nACTIONS:')

;request.del({uri:rest_base+'/ac1/coll1/foo=bar/'+item.id}, function(err,res,body) {
  printres(err,res,body)

;request.get({uri:rest_base+'/ac1/coll1/foo=bar'}, function(err,res,body) {
  printres(err,res,body)


  console.log('\n\nHISTORY:')

;request.get({uri:sync_base+'/ac1/coll1/foo=bar/version'}, function(err,res,body) {
  printres(err,res,body)

;request.get({uri:sync_base+'/ac1/coll1/foo=bar/history/0'}, function(err,res,body) {
  printres(err,res,body)

;request.get({uri:sync_base+'/ac1/coll1/foo=bar/updates/0'}, function(err,res,body) {
  printres(err,res,body)

;request.get({uri:sync_base+'/ac1/coll1/foo=bar/updates/1'}, function(err,res,body) {
  printres(err,res,body)

;request.get({uri:sync_base+'/ac1/coll1/foo=bar/updates/2'}, function(err,res,body) {
  printres(err,res,body)

;request.get({uri:sync_base+'/ac1/coll1/foo=bar/updates/3'}, function(err,res,body) {
  printres(err,res,body)


}) }) }) }) }) }) }) }) }) }) }) }) }) }) }) }) }) }) }) }) }) }) 

}

test()