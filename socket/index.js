/**
 * Created by jenia0jenia on 24.03.2015.
 */

/**
 * socket.io.
 */

//var logger = require('morgan');
var cookieParser = require('cookie-parser');
var async = require('async');
var cookie = require('cookie');
var sessionStore = require('lib/sessionStore');
var User = require('models/user').User;


// избавиться от дублирующихся имён в чате
// либо при авторизации, либо при подключении on.connection


function loadSession(sid, callback) {
    // sessionStore callback is not quite async-style!
    sessionStore.load(sid, function(err, session) {
        if (arguments.length == 0) {
            // no arguments => no session
            return callback(null, null);
        } else {
            return callback(null, session);
        }
    });

}

function loadUser(session, callback) {

    if (!session.user) {
        //console.log("Session %s is anonymous", session.id);
        //log.debug("Session %s is anonymous", session.id);
        return callback(null, null);
    }
    //console.log("retrieving user ", session.user);
    //log.debug("retrieving user ", session.user);

    User.findById(session.user, function(err, user) {
        if (err) return callback(err);

        if (!user) {
            return callback(null, null);
        }
        //console.log("user findById result:", user.username);
        //log.debug("user findById result:", user);
        callback(null, user);
    });

}

module.exports = function(server) {
    var io = require('socket.io').listen(server);
    io.set('origins', 'localhost:*');
    //io.set('logger', logger);

    io.set('authorization', function(handshake, callback) {

        async.waterfall([
            function(callback) {
                handshake.cookies = cookie.parse(handshake.headers.cookie || ''); // строка с куками
                var sidCookie = handshake.cookies['sid'];
                var sid = cookieParser.signedCookie(sidCookie, 'Amalgama');
                loadSession(sid, callback); // получаем сессию из базы
            },

            function(session, callback) {

                if (!session) {
                    callback(401);
                }
                handshake.session = session;
                loadUser(session, callback);
            },

            function(user, callback) {
                if (!user) {
                    callback(403);
                }
                handshake.user = user;
                callback(null);
            }
        ], function(err) { // результат авторизации
            if (!err) {
                return callback(null, true);
            }
            //
            //if (err instanceof HttpError) {
            //    return callback(null, false);
            //}
            callback(err);
        });

    });

    io.sockets.on('session:reload', function(sid) {
        var clients = io.sockets.clients();
        console.log('1', clients);
        console.log('2', io.sockets);
        console.log('3', sid);
        clients.forEach(function(client) {
            if (client.handshake.session.id != sid) return;

            loadSession(sid, function(err, session) {
                if (err) {
                    client.emit("error", "server error");
                    client.disconnect();
                    return;
                }

                if (!session) {
                    client.emit("logout");
                    client.disconnect();
                    return;
                }

                client.handshake.session = session;
            });

        });

    });

    io.sockets.on('connection', function(socket) {
        //получаем данные о подключённом пользователе
        var username = socket.request.user.username;
        socket.broadcast.emit('join', username);
        console.log('ws',socket.handshake);
        socket.on('message', function(text, cb) { //
            socket.broadcast.emit('message', username, text);
            cb && cb();
        });

        socket.on('disconnect', function() {
            socket.broadcast.emit('leave', username);
        });
    });

    return io;
};