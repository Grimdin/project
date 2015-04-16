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
    room = {};
    //readOnly = true
/**
 * Creates array of users names from object userList in current room
 * @param userList
 * @returns {Array}
 */
function getUsersArray(userList, room) {
    var arr = [];
    for (var item in userList) {
        if (userList[item][room])
            arr.push(userList[item][room].username);
    }
    //console.log(arr);
    return arr;
}

module.exports = function(server) {
    var io = require('socket.io').listen(server);

    io.on('connection', function(socket) {
        socket
        /**
         * событие при подключение пользователя или при открытии новой вкладки текущего пользователя
         */
            .on('add user', function(user, cb) {
                socket.join(user.room);
                socket.room = user.room;
                socket.userID = user.userID;
                socket.username = checkUsername(user.username);
                /**
                 * если юзера нет в userList или его нет в подклчаемой комнате, то добавим его (url)
                 */
                if ( !(socket.userID in userList) || !(socket.room in userList[socket.userID]) ) {
                    userList[socket.userID] = {};
                    userList[socket.userID][socket.room] = {tabs: 0, username: socket.username, readOnly: true};
                    //console.log(userList[user.userID].tabs);
                    socket.broadcast.to(socket.room).emit('join', socket.username, getUsersArray(userList, socket.room));
                    //console.log('1:', socket.userID in userList);
                }
                //console.log('1****users list', userList);
                async.waterfall([
                        function(callback) {
                            //console.log('users names in this room', userList[socket.userID][socket.room]);
                            collection.findOne({ url: socket.room }, callback);
                        },
                        function(doc, callback) {
                            //console.log(doc);
                            if (!doc.userID) {
                                userList[socket.userID][socket.room].readOnly = 'admin';
                                //console.log('update haas been');
                                collection.findAndModify({ query:{url: socket.room}, update: {$set : {userID: socket.userID}} }, callback)
                            } else if (doc.userID === socket.userID) {
                                userList[socket.userID][socket.room].readOnly = 'admin';
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
                        userList[socket.userID][socket.room].tabs++;
                        //console.log(result.code);
                        cb(getUsersArray(userList, socket.room), userList[socket.userID][socket.room].readOnly);
                        //console.log('2****users list', userList);
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
                //console.log(userList[socket.userID][socket.room].tabs);
                if ( userList[socket.userID][socket.room].tabs === 1 ) {
                    //console.log('on logout', socket.userID);
                    delete userList[socket.userID][socket.room];
                    setTimeout(function () {
                        socket.broadcast.to(socket.room).emit('leave', socket.username, getUsersArray(userList, socket.room));
                    }, 1000);
                    cb && cb();
                } else { userList[socket.userID][socket.room].tabs--; }
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