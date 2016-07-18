require('dotenv').config();

var express = require('express')
var port = process.env.CLIENT_PORT || 3000
var app = express()
var request = require('superagent')
var querystring = require('querystring')

app.listen(port,function(){
  console.log('Auth Client listening on port',port)
})

var authHost = process.env.HOSTNAME + ':' + process.env.PORT
var host = process.env.HOSTNAME + ':' + port

app.get('/',function(req,res,next){
  request
  .post(authHost)
  .set('authorization','Bearer ' + process.env.ADMIN_TOKEN)
  .end(function(err,result){
    if(err) return next(err)
    var params = {
      onsuccess:host+'/success/' + result.body.id,
      onfailure:host+'/failure/' + result.body.id,
    }
    params = querystring.stringify(params)
    res.redirect(authHost + '/steam/' + result.body.id+'?'+params)
  })
})

app.get('/success/:token',function(req,res,next){
  request.get(authHost+'/'+ req.params.token)
    .set('authorization','Bearer ' + process.env.ADMIN_TOKEN)
    .end(function(err,result){
      if(err) return res.send(err)
      res.json(result.body)
    })
})
app.get('/failure/:token',function(req,res,next){
  res.json(req.query)
})
