var bearerToken = require('express-bearer-token')
module.exports = function(app,env,cache){
    
  // function validateToken(req,res,next){
  //   if(req.token == null) return res.sendStatus(406).send( 'all requests require bearer token, see https://github.com/tkellen/js-express-bearer-token')
  //   next()
  // }

  return bearerToken({
    reqKey:'admintoken'
  })
}
