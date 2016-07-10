var lodash = require('lodash')
var cors = require('cors')

module.exports = function(store){
  var whitelist = []
  store.get('whitelist').then(function(wl){
    whitelist = wl
  })
  store.on('whitelist',function(value){
    whitelist = value.whitelist
  })

  var corsOptions = {
    origin: function(origin, callback){
      var originIsWhitelisted = whitelist.indexOf(origin) !== -1;
      callback(null, originIsWhitelisted);
    }
  };

  return cors(corsOptions)
}
