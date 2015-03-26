/**
 * Created by jenia0jenia on 23.03.2015.
 */

exports.post = function(req, res, next) {
    var sid = req.session.id;
    var io = req.app.get('io');
    var username = req.user.username;
    console.log('logout');
    req.session.destroy(function(err) {
        if (err) return next(err);
        io.sockets.emit('session:reload', sid);
        res.redirect('/');
    });

};