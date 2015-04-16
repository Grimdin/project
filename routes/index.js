/* GET home page. */

var config = require('./config');
var hardcode = require('./hardcode');
var frontpage = require('./frontpage');
var all = require('./new');
var collection = require('../lib/monk');

module.exports = function(app) {
    app.get('/', frontpage.get);

    app.route('/config')
      .get(config.get)
      .post(config.post);

    app.route('/hardcode')
      .get(hardcode.get);

    app.all('*', function (req, res) {
        var url = req.url.replace('/', '');
        collection.find({url: url}, function(err, result) {
            if (err) throw err;
            if (result.toString()) {
                    res.render('hardcode');
            } else {
                res.status(404);
                res.render('error', {
                    message: err,
                    error: 'error'
                });
            }
        })
    });
};