/**
 * Created by jenia0jenia on 24.03.2015.
 */

/** события сервера, и реакция на события клиента
 * socket.io.
 */

/**
 * Module dependencies.
 */
var async = require('async');
var collection = require('lib/monk');

/**
 * Removes non-letters symbols
 * @param username
 * @returns {*|string}
 */
function checkUsername(username) {
    username = username.replace(/,|\.|:|;|\[|]|\{|}/g, '') || 'Anonymous';
    return username;
}

/**
 * List of connected users
 * @type {{}}
 */
var userList = {},
    readOnly = true,
    room;
/**
 * Creates array of users names from object userList
 * in current room
 * @param userList
 * @param room
 * @returns {Array}
 */
function getUsersArray(userList, room) {
    var arr = [];
    for (var item in userList) {
        if (userList[item].room === room){
            arr.push(userList[item].username);
        }
    }
    return arr;
}

module.exports = function(server) {
    var io = require('socket.io').listen(server);

    io.on('connection', function(socket) {
        //получаем данные о подключённом пользователе
        socket
        /**
         * событие при подключение пользователя или при открытии новой вкладки текущего пользователя
         */
            .on('add user', function(user, cb) {
                socket.join(user.room);
                socket.room = user.room;
                socket.userID = user.userID;
                socket.username = checkUsername(user.username);
                //console.log(user);
                /**
                 * если юзера нет в userList, то добавим его
                 * и сообщим остальным о его подключении
                 */
                if ((!(socket.userID in userList)) || userList[socket.userID].room !== socket.room) {
                    userList[socket.userID] = {tabs: 0, room: socket.room, username: socket.username};
                    console.log(userList);
                    //console.log(userList[user.userID].tabs);
                    socket.broadcast.to(socket.room).emit('join', socket.username, getUsersArray(userList, socket.room));
                }
                async.waterfall([
                        function(callback) {
                            //console.log(socket.room);
                            collection.findOne({ url: socket.room }, callback);
                        },
                        function(doc, callback) {
                            //console.log(doc);
                            if (!doc.userID) {
                                readOnly = false;
                                //console.log('update haas been');
                                collection.findAndModify({ query:{url: socket.room}, update: {$set : {userID: socket.userID}} }, callback)
                            } else if (doc.userID === socket.userID) {
                                readOnly = false;
                                callback(null, doc);
                            } else {
                                callback(null, doc);
                            }
                        }
                    ],
                    function(err, result) {
                        if (err) throw err;
                        //console.log(result);
                        socket.emit('change code', result.code);
                        userList[socket.userID].tabs++;
                        //console.log(result.code);
                        cb(getUsersArray(userList, socket.room), readOnly);
                    }
                );

            })

            .on('message', function(text, cb) {
                io.sockets.in(socket.room).emit('message', socket.username, text);
                cb && cb();
            })

            .on('typing', function () {
                socket.broadcast.to(socket.room).emit('typing', socket.username);
            })

            .on('stop typing', function () {
                socket.broadcast.to(socket.room).emit('stop typing', socket.username);
            })

            .on('disconnect', function(username, cb) {
                //console.log(userList[socket.userID].tabs);
                if (userList[socket.userID].tabs === 1) {
                    //console.log('tabs', userList[socket.userID]);
                    //console.log('on logout', socket.userID);
                    userList[socket.userID] = 0;
                    setTimeout(function () {
                        socket.broadcast.to(socket.room).emit('leave', socket.username, getUsersArray(userList, socket.room));
                    }, 1000);
                    cb && cb();
                } else {  userList[socket.userID].tabs--; }

            })

            .on('change code', function(code, cb) {
                collection.update({url: socket.room}, { $set: {code: code} }, function(err, result) {
                    if (err) throw err;
                    //console.log('to room', socket.room, userList[socket.userID].room);
                    socket.broadcast.to(socket.room).emit('change code', code);
                    cb && cb();
                    //console.log('changed code', code);
                });
            });
    });
    return io;
};