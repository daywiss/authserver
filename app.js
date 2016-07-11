require('dotenv').config();

var express = require('express')
var router = require('./router')
var steam = require('./steam')
var Store = require('./modules/memstore')
var Middleware = require('./middleware')

var app = express()
app.listen(process.env.PORT,function(){
  console.log('Server listening on port',process.env.PORT)
})

var store = Store()
var wl = process.env.WHITELIST || '' 
store.set('whitelist',wl.split(','))

app.use(Middleware.config(store,process.env))
app.use(Middleware.whitelist(store,process.env))
app.use(Middleware.parsetoken(store,process.env))

// app.use('/',Middleware.parsetoken(store),router(store,process.env))
// app.use('steam/',Middleware.parsetoken(store),steam(store,process.env))

router(app,store,process.env)
steam(app,store,process.env)

app.all('/',function(req,res){
  res.sendStatus(404)
})

  
module.exports = app
