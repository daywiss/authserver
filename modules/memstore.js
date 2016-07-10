var Promise = require('bluebird')
var Emitter = require('events')
var lodash = require('lodash')


function get(store,key){
  return Promise.resolve(store[key])
}
function set(store,emitter,key,value){
  store[key] = value
  emitter.emit(key,{[key]:value})
  emitter.emit('change',store)
  return Promise.resolve(value)
}

// function clear(store,emitter,emit){
//   lodash.each(store,function(value,key){
//     if(emit(
//   })
// }



module.exports = function(){
  var store = {}
  var emitter = new Emitter()
  emitter.get = lodash.bind(get,null,store)
  emitter.set = lodash.bind(set,null,store,emitter)
  return emitter
}
