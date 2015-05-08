/* GET home page. */

var config = require('./config');
var hardcode = require('./hardcode');
var about = require('./about');
var frontpage = require('./frontpage');
var all = require('./all');

module.exports = function(app) {
    app.get('/', frontpage.get);

    app.route('/config')
      .get(config.get)
      .post(config.post);

    app.route('/hardcode')
      .get(hardcode.get);

    app.route('/about')
        .get(about.get);

    app.all('*', all);
};