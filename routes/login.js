/**
 * Created by jenia0jenia on 22.03.2015.
 */

var async = require('async');
var User = require('models/user').User;

/* GET users listing. */
exports.get = function(req, res) {
        res.render('login');
};

exports.post = function(req, res, next) {
    var username = req.body.username;
    var password = req.body.password;

    User.authorize(username, password, function(err, user) {
        if (err) {
            return next(err);
        }
        req.session.user = user._id;
        res.redirect('hardcode');
    });
};