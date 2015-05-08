'use strict'
/**
 * Created by jenia0jenia on 24.03.2015.
 */

/** события сервера, и реакция на события клиента
 * socket.io
 */

/**
 * Module dependencies.
 */
var async = require('async');
var collection = require('../lib/monk');

/**
 * List of connected users
 * @type {{}}
 */
var userList = {},
    rooms = [],
    usersID = [];

module.exports = function(server) {
    var io = require('socket.io').listen(server);
    io.set('transports', ['websocket',
        'flashsocket',
        'htmlfile',
        'xhr-polling',
        'jsonp-polling',
        'polling']);
    io.on('connection', function(socket) {
        socket
        /**
         * событие при подключение пользователя или при открытии новой вкладки текущего пользователя
         */
            .on('add user', function(user, cb) {
                var self = this;
                this.join(user.room);
                this.room = user.room;
                this.userID = user.userID;
                this.username = checkUsername(user.username);
                /**
                 * если юзера нет в userList или его нет в подклчаемой комнате, то добавим его (url)
                 */
                if ( !(this.userID in userList) )
                    userList[this.userID] = {};
                if ( !(this.room in userList[this.userID]) ){
                    usersID.push(this.userID);
                    rooms.push(this.room);
                    userList[this.userID][this.room] = {tabs: 0, username: this.username, readOnly: true};
                    //console.log(userList[user.userID].tabs);
                    socket.broadcast.to(this.room).emit('join', this.username, getUsersArray(userList, this.room));
                    //console.log('1:', socket.room, userList);
                }
                //console.log('1****users list', userList);
                async.waterfall([
                        function(callback) {
                            //console.log('users names in this room', userList[socket.userID][socket.room]);
                            collection.findOne({ url: self.room }, callback);
                        },
                        function(doc, callback) {
                            //console.log('on update', doc);
                            if (!doc.userID) {
                                userList[self.userID][self.room].readOnly = 'admin';
                                collection.findAndModify({ query:{url: self.room}, update: {$set : {userID: self.userID}} }, callback)
                            } else if (doc.userID === self.userID) {
                                userList[self.userID][self.room].readOnly = 'admin';
                                callback(null, doc);
                            } else {
                                callback(null, doc);
                            }
                        }
                    ],
                    function(err, result) {
                        if (err) throw err;
                        //console.log(result);
                        if (self.room)
                            userList[self.userID][self.room].tabs++;
                        socket.emit('change code', result.code);
                        //console.log('s', socket.connected);
                        cb(getUsersArray(userList, self.room));
                        //console.log('2****users list', userList);
                    }
                );
            })

            .on('message', function(text, cb) {
                io.sockets.in(this.room).emit('message', this.username, text);
                cb && cb();
            })

            .on('typing', function () {
                socket.broadcast.to(socket.room).emit('typing', socket.username);
            })

            .on('stop typing', function () {
                socket.broadcast.to(socket.room).emit('stop typing', socket.username);
            })

            .on('disconnect', function(username, cb) {
                if ( this.room && userList[this.userID][this.room].tabs <= 1 ) {
                    //setTimeout(function () {
                        //console.log('has leave');
                    socket.broadcast.to(this.room).emit('leave', this.username, getUsersArray(userList, this.room));
                    //}, 0);
                    delete userList[this.userID][this.room];
                    cb && cb();
                } else if (this.room) { userList[this.userID][this.room].tabs--; }
                //console.log(socket.room);
                //console.log(userList);
            })

            .on('change code', function(code, cb) {
                var self = this;
                collection.update({url: this.room}, { $set: {code: code} }, function(err, result) {
                    if (err) throw err;
                    //console.log('to room', self.room, self.userID);
                    socket.broadcast.to(self.room).emit('change code', code);
                    cb && cb();
                    //console.log('changed code', code);
                });
            });
    });
    return io;
};

/**
 * Creates array of users names from object userList in current room
 * @param userList
 * @returns {Array}
 */
function getUsersArray(userList, room) {
    var usersInRoom = {};
    for (var item in userList) {
        if (userList[item][room]) {
            usersInRoom[item] = {
                "username": userList[item][room].username,
                "readOnly": userList[item][room].readOnly
            };
        }
    }
    //console.log(arr);
    return usersInRoom;
}

/**
 * Removes non-letters symbols
 * @param username
 * @returns {*|string}
 */
function checkUsername(username) {
    username = username.replace(/,|\.|:|;|\[|]|\{|}/g, '') || 'Anonymous';
    return username;
}
