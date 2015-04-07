/**
 * Created by jenia0jenia on 24.03.2015.
 */

/**
 * socket.io.
 */

//var logger = require('morgan');
var async = require('async');
var collection = require('lib/monk');

function checkUsername(username) {
    username = username.replace(/,|\.|:|;|\[|]|\{|}/g, '') || 'Anonymous';
    return username;
}

var userList = {};
function getUsersArray(userList) {
    var arr = [];
    for (var item in userList) {
        arr.push(userList[item].username);
    }
    return arr;
}

module.exports = function(server) {
    var io = require('socket.io').listen(server);
    io.on('connection', function(socket) {
        //console.log('connection', userList.userID.tabs);
        var url = socket.handshake.headers.referer.split('/');
        url = url[url.length - 1];
        //получаем данные о подключённом пользователе
        socket
            .on('add user', function(user, cb) {
                socket.userID = user.userID;
                socket.username = checkUsername(user.username);
                //console.log(socket.userID, socket.username);
                if (!(socket.userID in userList)) { // если юзера нет в userList
                    userList[user.userID] = user;
                    userList[user.userID].tabs = 0;
                    //console.log(userList[socket.userID]);
                    //console.log(userList[user.userID].tabs);
                    socket.broadcast.emit('join', user.username, getUsersArray(userList));
                }
                async.waterfall([
                        function(callback) {
                            collection.findOne({ userID: socket.userID, url: url}, callback);
                        },
                        function(doc, callback) {
                            if (!doc) collection.insert({ userID: socket.userID, url: url, code: ''}, callback);
                            else callback(null, doc);
                        }
                    ],
                    function(err, result) {
                        if (err) throw err;
                        socket.emit('change code', result.code);
                        userList[socket.userID].tabs++;
                        console.log(userList[user.userID].tabs);
                        cb(getUsersArray(userList));
                    }
                );

            })

            .on('message', function(text, cb) {
                io.emit('message', socket.username, text);
                cb && cb();
            })

            .on('typing', function () {
                socket.broadcast.emit('typing', socket.username);
            })

            .on('stop typing', function () {
                socket.broadcast.emit('stop typing', socket.username);
            })

            .on('disconnect', function(username, cb) {
                console.log(userList[socket.userID].tabs);
                if (userList[socket.userID].tabs === 1) {
                    //console.log('tabs', userList[socket.userID]);
                    //console.log('on logout', socket.userID);
                    delete userList[socket.userID];
                    setTimeout(function () {
                        socket.broadcast.emit('leave', socket.username, getUsersArray(userList));
                    }, 1000);
                    cb && cb();
                } else {  userList[socket.userID].tabs--; }

            })

            .on('change code', function(code, cb) {
                collection.update({url: url}, { $set: {code: code} }, function(err, result) {
                    if (err) throw err;
                    socket.broadcast.emit('change code', code);
                    cb && cb();
                    //console.log('changed code', result);
                });
            });
    });
    return io;
};