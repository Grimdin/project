/**
 * Created by jenia0jenia on 24.03.2015.
 */

module.exports = function(req, res, next) {
    if (!req.session.user) {
        return next(401);
    }
    next();
};