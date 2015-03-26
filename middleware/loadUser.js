/**
 * Created by jenia0jenia on 24.03.2015.
 */

var User = require('models/user').User;

module.exports = function(req, res, next) {
    req.user = res.locals.user = null;

    if (!req.session.user) return next();

    User.findById(req.session.user, function(err, user) {
        if (err) return next(err);
        req.user = res.locals.user = user.username;
        req.mode = res.locals.mode = user.mode;
        next();
    });

};