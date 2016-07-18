var Openid = require('openid')
var shortid = require('shortid')
var uuid = require('node-uuid')
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

//hacky state managment because steam openid does not support associations
//the openid relying party should only be generated once on program start
//and reused for each auth. Here we create a new one each with different endpoint.
function statefulAuthenticate(url,verify,host,cache,state){
  var id = uuid.v4()
  verify = verify + '/' + id
  var openid = new Openid.RelyingParty(verify,host,true,true,[])

  state.verify = Promise.promisify(openid.verifyAssertion,{context:openid})
  cache.set(id,state)

  return Promise.fromCallback(function(cb){
    return openid.authenticate(url,false,cb)
  })
}

function statefulVerify(cache,id,req){
  var state = cache.get(id)
  if(state == null) return Promise.reject(new Error('steam association not found'))
  return state.verify(req).then(function(result){
    cache.del(id)
    result.state = state
    return result
  })
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

  app.get('/steam/verify/:id?',function(req,res,next){
    var state = null
    statefulVerify(authCache,req.params.id,req).then(function(result){
      if(!result || !result.authenticated) throw new Error('Steam user did not log in successfully')
      state = result.state
      // console.log(state)
      return getUserInfo(result.claimedIdentifier,env.STEAM_API_KEY)
    }).then(function(steamData){
      return updateUserSteam(cache,state.token,steamData)
    }).then(function(result){
      // console.log(result)
      return res.redirect(state.onsuccess)
      // res.json(result.steam)
    }).catch(function(err){
      var error = querystring.stringify({
        error:err.message
      })
      console.log(error)
      if(state && state.onfailure){
        return res.redirect(state.onfailure + '?' + error)
        // return res.redirect(openidState.onfailure)
      }else{
        return res.status(500).json(err)
      }
      // next(err)
    }).finally(function(){
      authCache.del(req.params.id)
    })                                                             
  })

  app.get('/steam/:token',function(req,res,next){
    // if(req.query.onsuccess == null) return res.status(500).send('steam openid auth requires onsuccess callback url')
    req.query.onsuccess = req.query.onsuccess || host

    var token = cache.get(req.params.token)
    if(token == null) return res.status(404).send('client token not found')

    var state = {
      token:token.id,
      onsuccess:req.query.onsuccess || host,
      onfailure:req.query.onfailure || req.query.onsuccess
    }

    //hack to add stateful data to steam response
    statefulAuthenticate(steamURL,verify,host,authCache,state).then(function(authURL){
      if(authURL == null) throw new Error('Steam Authentication Error: No auth url returned')
      res.redirect(authURL)
    }).catch(function(err){
      if(err) return res.status(500).send(err.message)
    })
    // openid.authenticate(steamURL,false,function(err,authURL){
    //   var parsed = querystring.parse(authURL)
    //   console.log(parsed)
    //   // var path = authURL.split('?')[0]
    //   // parsed['openid.return_to'] = parsed['openid.return_to'] + '/' + token.id
    //   // console.log(path,parsed)
    //   // var authURL = path + '?' + querystring.stringify(parsed)
    //   // console.log(authURL)
      
    // })

  })

}
