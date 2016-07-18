var assert = require('assert')
module.exports = function(app,env,cache){

  assert(env.ADMIN_TOKEN,'admin middleware requires env.ADMIN_TOKEN')

  var admintoken = env.ADMIN_TOKEN
  
  function checkAdmin(req,res,next){
    if(req.admintoken && req.admintoken == admintoken){
      req.admin = true
    }
    next()
  }

  function isAdmin(req,res,next){
    if(req.admin == null) return res.status(401).send('all requests require admin authorization token')
    next()
  }


  return [checkAdmin]
}
