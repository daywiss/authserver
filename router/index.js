module.exports = function(app,store,env){
  app.get('/',function(req,res,next){
    store.get(req.token).then(function(user){
      res.json(user)
    })
  })
}
