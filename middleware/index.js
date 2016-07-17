
module.exports = function(app,env,cache){
  app.use(require('./config')(app,env,cache))
  app.use(require('./parsetoken')(app,env,cache))
  app.use(require('./admin')(app,env,cache))
}
