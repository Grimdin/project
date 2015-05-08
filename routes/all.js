/**
 * Created by jenia0jenia on 19.04.2015.
 */

var collection = require('../lib/monk');

module.exports = function (req, res) {
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
};