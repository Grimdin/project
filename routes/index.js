//var router = express.Router();

/* GET home page. */
var checkAuth = require('middleware/checkAuth');
module.exports = function(app) {

  app.get('/', require('./frontpage').get);

  app.get('/userconfig', require('./userconfig').get);
  app.post('/userconfig', require('./userconfig').post);

  app.get('/hardcode', checkAuth, require('./hardcode').get);

  app.get('/login', require('./login').get);
  app.post('/login', require('./login').post);

  app.post('/logout', require('./logout').post);

};