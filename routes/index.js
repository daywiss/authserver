var uuid = require('node-uuid')
var assert = require('assert')
var Router = require('express').Router
var lodash = require('lodash')

function makeToken(duration,defaultDuration){
  return renewToken({ id:uuid.v4(), },duration,defaultDuration)
}

function renewToken(token,duration,defaultDuration){
  token.expires = Date.now() +  (duration ? duration : defaultDuration)
  return token
}

module.exports = function(app,env,cache){
  assert(env,'routes require env.TTL')
  assert(env.TTL,'routes require env.TTL')

  var ttl = parseInt(env.TTL)

  var router = Router()
  router.route('/:id')
    .all(function(req,res,next){
      var token = cache.get(req.params.id)
      if(token == null) return res.status(404).send('token not found')
      req.token = token
      next()
    })
    //get token
    .get(function(req,res,next){
      res.json(req.token)
    })
    //renew token
    .post(function(req,res,next){
      var token = renewToken(req.token,req.body.duration,ttl)
      cache.set(token.id,token,req.body.duration)
      res.json(token)
    })
    //add custom data to token
    .put(function(req,res,next){
      var token = lodash.extend(req.token,lodash.omit(req.body,['id']))
      cache.set(token.id,token)
      res.json(token)
    })
    //delete token
    .delete(function(req,res,next){
      cache.del(req.token.id)
      res.send(true)
    })

  //get all tokens
  router.get('/',function(req,res,next){
    res.json(cache.values())
  })

  //generate token
  router.post('/',function(req,res,next){
    var token = makeToken(req.body.duration,ttl)
    cache.set(token.id,token,req.body.duration)
    res.json(token)
  })

  app.use(router)

}
