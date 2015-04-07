//var router = express.Router();

/* GET home page. */
var config = require('./config');
var hardcode = require('./hardcode');
module.exports = function(app) {

  app.get('/', require('./frontpage').get);

  app.route('/config')
      .get(config.get)
      .post(config.post);

  app.route('/hardcode')
      .get(hardcode.get)
      .post(hardcode.post);
};