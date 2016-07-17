var Openid = require('openid')
var shortid = require('shortid')
var request = require('request-promise')
var Promise = require('bluebird')
var lodash = require('lodash')
var LRU = require('lru-cache')
var querystring = require('querystring')

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

function updateUserSteam(cache,token,steamData){
  userData = cache.get(token)
  userData = userData || {}
  userData.steam = steamData
    // console.log('setting user data',token,userData)
  cache.set(token,userData)
  return userData
}


module.exports = function(app,env,cache){

  if(env.HOSTNAME == null || env.PORT == null){
    throw 'must supply HOSTNAME and PORT in .env file'
  }
  if(env.STEAM_API_KEY == null){
    throw 'must supply steam api key in STEAM_API_KEY in .env file'
  }

  var cacheOptions = {
    maxAge: 1000 * 60 * 60
  }

  var authCache = LRU(cacheOptions)

  var steamURL = 'http://steamcommunity.com/openid' 
  var host = [env.HOSTNAME,':',env.PORT].join('')
  var verify = [host,'steam','verify'].join('/')

  var openid = new Openid.RelyingParty(verify,host,true,true,[])
  //this will be updated with every auth/verify
  var openidState = null
  //add our own functions for openid statefulness so we can associate it with client token
  openid.saveAssociation = function(provider,type,handle,secret,timeout,cb){
    console.log('saving openid state',currentToken)
    authCache.set(handle,{ provider:provider, secret:secret, type:type, state:openidState },timeout*1000)
    cb()
  }
  openid.loadAssociation = function(handle,cb){
    var ass = authCache.get(handle)
    openidState = ass.state
    console.log('loading openid state',openidState)
    cb(null,ass)
  }

  app.get('/steam/:token',function(req,res,next){
    if(req.query.onsuccess == null) return res.status(500).send('steam openid auth requires onsuccess callback url')

    var token = cache.get(token)
    if(token == null) return res.status(404).send('token not found')

    openidState = {
      token:token.id,
      onsuccess:req.query.onsuccess,
      onfailure:req.query.onfailure || req.query.onsuccess
    }

    auth.authenticate(steamURL,id,function(err,authURL){
      if(err) return res.status(500).send('Steam Authentication Error:'+err)
      if(authURL == null) return res.status(500).send('Steam Authentication Error: No auth url returned')
      res.redirect(authURL)
    })

  })

  app.get('/steam/verify',function(req,res,next){

    Promise.promisify(auth.openid.verifyAssertion)(req).then(function(result){
      if(!result || !result.authenticated) throw 'Steam user did not log in successfully'
      return getUserInfo(result.claimedIdentifier,env.STEAM_API_KEY)
    }).then(function(steamData){
      return updateUserSteam(cache,auth.token,steamData)
    }).then(function(result){
      // console.log(result)
      return res.redirect(openidState.onsuccess)
      // res.json(result.steam)
    }).catch(function(err){
      var error = querystring.stringify({
        error:err
      })
      return res.redirect(openidState.onfailure + '&' + error)
      // next(err)
    }).finally(function(){
      authCache.del(req.params.id)
    })                                                             
  })

}
