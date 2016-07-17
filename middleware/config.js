var bodyParser = require('body-parser')
var cors = require('cors')

module.exports = function(app,env,cache){
  return [cors(),bodyParser.json()]
}
