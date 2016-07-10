var bodyParser = require('body-parser')
var cors = require('cors')

module.exports = function(store,env){
  return [cors(),bodyParser.json()]
}
