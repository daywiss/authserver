process.env.PORT = 3999

var test = require('tape')
var request = require('supertest')
var app = require('../app')

var token = null
test('test token api',function(t){
  t.test('POST / (creating token)',function(t){
    request(app)
      .post('/')
      .set({authorization:'Bearer ' + process.env.ADMIN_TOKEN})
      .expect(200)
      .end(function(err,res){
        // console.log(res.body)
        token = res.body
        t.ok(res.body.id)
        t.ok(res.body.expires)
        t.end(err)
      })
  })
  t.test('POST / (creating expiring token)',function(t){
    request(app)
      .post('/')
      .set({authorization:'Bearer ' + process.env.ADMIN_TOKEN})
      .send({duration:1000})
      .expect(200)
      .end(function(err,res){
        // console.log(res.body)
        t.ok(res.body.id)
        t.ok(res.body.expires)
        t.end(err)
      })
  })
  t.test('GET /:token',function(t){
    request(app)
      .get('/' + token.id)
      .set({authorization:'Bearer ' + process.env.ADMIN_TOKEN})
      .expect(200)
      .end(function(err,res){
        t.deepEqual(token,res.body)
        t.end(err)
      })
  })
  t.test('POST /:token (renew token)',function(t){
    request(app)
      .post('/' + token.id)
      .set({authorization:'Bearer ' + process.env.ADMIN_TOKEN})
      .expect(200)
      .end(function(err,res){
        t.equal(token.id,res.body.id)
        t.notEqual(res.body.expires,token.expires)
        t.end(err)
      })
  })
  t.test('GET /',function(t){
    request(app)
      .get('/')
      .set({authorization:'Bearer ' + process.env.ADMIN_TOKEN})
      .expect(200)
      .end(function(err,res){
        t.ok(res.body.length)
        t.end(err)
      })
  })

  t.test('PUT /:token (renew token)',function(t){
    request(app)
      .put('/' + token.id)
      .set({authorization:'Bearer ' + process.env.ADMIN_TOKEN})
      .send({
        id:'test',
        custom:{
          foo:'bar'
        }
      })
      .expect(200)
      .end(function(err,res){
        t.equal(token.id,res.body.id)
        t.ok(res.body.custom)
        t.end(err)
      })
  })

  t.test('DELETE /:token (renew token)',function(t){
    request(app)
      .delete('/' + token.id)
      .set({authorization:'Bearer ' + process.env.ADMIN_TOKEN})
      .expect(200)
      .end(function(err,res){
        t.ok(res.body)
        t.end(err)
      })
  })

  t.test('GET /:token (does not exist)',function(t){
    request(app)
      .get('/' + token.id)
      .set({authorization:'Bearer ' + process.env.ADMIN_TOKEN})
      .expect(404)
      .end(function(err,res){
        t.end()
      })
  })
})
