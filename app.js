require('dotenv').config();

var express = require('express')
var routes = require('./routes')
var steam = require('./steam')
var LRU = require('lru-cache')
var middleware = require('./middleware')

var app = express()
app.listen(process.env.PORT,function(){
  console.log('Server listening on port',process.env.PORT)
})

process.env.TTL = process.env.TTL || 1000*60*60*24*7

var cacheOptions = {
  maxAge: process.env.TTL 
}

var cache = LRU(cacheOptions)

middleware(app,process.env,cache)
steam(app,process.env,cache)
routes(app,process.env,cache)
  
module.exports = app
