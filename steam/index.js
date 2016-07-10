var openid = require('openid')
var shortid = require('shortid')
var request = require('request-promise')
var Promise = require('bluebird')
var lodash = require('lodash')

var steamURL = 'http://steamcommunity.com/openid' 
var base = '/steam'

function getUserInfo(steamIDURL,apiKey)
{
  var steamID = steamIDURL.replace('http://steamcommunity.com/openid/id/', '');
  // our url is http://steamcommunity.com/openid/id/<steamid>
  return request('http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key='+apiKey+'&steamids=' + steamID)
    .then(function(res) {
      var players = JSON.parse(res).response.players;
      if(players.length == 0) throw new Error('No players found for the given steam ID.');
      var player = players[0];
      return Promise.resolve({
        steamid: steamID,
        username: player.personaname,
        name: player.realname,
        profile: player.profileurl,
        avatar: {
          small: player.avatar,
          medium: player.avatarmedium,
          large: player.avatarfull
        }
      })
    });
}

function updateUserSteam(store,token,steamData){
  return store.get(token).then(function(userData){
    userData = userData || {}
    userData.steam = steamData
    return store.set(token,userData)
  })
}

function clearTimeouts(auths){
  var now = Date.now()
  lodash.each(auths,function(value,key){
    if(value.expires < now){
      delete auths[key]
    }
  })
}

function validateToken(req,res,next){
  if(req.token == null) return res.status(406).send( 'request requires bearer token, see https://github.com/tkellen/js-express-bearer-token')
  next()
}

module.exports = function(app,store,env){
  if(env.HOSTNAME == null || env.PORT == null){
    throw 'must supply HOSTNAME and PORT in .env file'
  }
  if(env.STEAM_API_KEY == null){
    throw 'must supply steam api key in STEAM_API_KEY in .env file'
  }
  var auths = {}

  function timeoutChecker(){
    clearTimeouts(auths)
    setTimeout(timeoutChecker,1000)
  }
  timeoutChecker()


  app.get(base,validateToken,function(req,res){
    store.get(req.token).then(function(result){
      if(result == null) res.send(null)
      return res.json(result.steam)
    })
  })

  app.get(base+'/auth',function(req,res,next){
    var host = [env.HOSTNAME,':',env.PORT].join('')
    var id = shortid.generate()
    var verify = [host,'steam','verify',id].join('/')
    var auth = new openid.RelyingParty(verify,host,true,true,[])
    auth.authenticate(steamURL,false,function(err,authURL){
      if(err) return res.status(500).send('Steam Authentication Error:'+err)
      if(authURL == null) return res.status(500).send('Steam Authentication Error: No auth url returned')
      auths[id] = {
        id:id,
        openid:auth,
        token:req.token,
        expires:Date.now() + 3600000 ,
        returnURL:req.query.returnURL
      }
      res.redirect(authURL)
    })

  })

  app.get(base+'/verify/:id',function(req,res,next){
    var auth = auths[req.params.id]
    if(auth == null) return next('Failed to authenticate steam user')
    if(auth.openid == null) return next('Failed to authenticate steam user')
    auth.openid.verifyAssertion(req,function(err,result){
      if(err) return next(err.message)
      if(!result || !result.authenticated) return next('Failed to authenticate steam user')
      getUserInfo(result.claimedIdentifier,env.STEAM_API_KEY).then(function(steamData){
        return updateUserSteam(store,auth.token,steamData)
      }).then(function(result){
        var redirect = auth.returnURL
        delete auths[req.params.id]
        if(redirect) return res.redirect(redirect)
        res.json(result.steam)
      }).catch(function(err){
        var redirect = auth.returnURL
        delete auths[req.params.id]
        if(redirect) return res.redirect(redirect)
        next(err)
      })
    })
  })

}
