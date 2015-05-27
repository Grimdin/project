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
                //console.log('*** connected', socket.id);
                /**
                 * если юзера нет в userList или его нет в подклчаемой комнате, то добавим его (url)
                 */
                if ( !(this.userID in userList) )
                    userList[this.userID] = {};
                if ( !(this.room in userList[this.userID]) ){
                    usersID.push(this.userID);
                    rooms.push(this.room);
                    userList[this.userID][this.room] = {username: this.username, readOnly: true, socketID : []};
                    socket.broadcast.to(this.room).emit('join', this.username,
                        getUsersArray(userList, this.room, userList[this.userID][this.room].readOnly)
                    );
                }
                async.waterfall([
                        function(callback) {
                            collection.findOne({ url: self.room }, callback);
                        },
                        function(doc, callback) {
                            if (!doc.userID) {
                                userList[self.userID][self.room].readOnly = 'admin';
                                collection.findAndModify({
                                    query:{url: self.room},
                                    update: {$set : {userID: self.userID}} },
                                    callback)
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
                        userList[self.userID][self.room].socketID.push(self.id);
                        socket.emit('change code', result.code);
                        cb(getUsersArray(userList, self.room, userList[self.userID][self.room].readOnly));
                    }
                );
                //console.log('table', userList);
            })

            .on('message', function(text, cb) {
                io.sockets.in(this.room).emit('message', this.username, text);
                cb && cb();
            })

            //.on('typing', function () {
            //    socket.broadcast.to(socket.room).emit('typing', socket.username);
            //})
            //
            //.on('stop typing', function () {
            //    socket.broadcast.to(socket.room).emit('stop typing', socket.username);
            //})

            .on('disconnect', function(username, cb) {
                var self = this,
                    sID = this.id;
                userList[this.userID][this.room].socketID.forEach(function(id, i) {
                    if (id === sID) {
                        userList[self.userID][self.room].socketID.splice(i, 1);
                    }
                });
                //console.log('*** disconnect', socket.id, 'and', userList[self.userID][self.room].socketID);
                if ( this.room && !userList[this.userID][this.room].socketID.length ) {
                    delete userList[this.userID][this.room];
                    //console.log(userList[this.userID][this.room], 'and', this.room, 'and', userList);
                    socket.broadcast.to(this.room).emit('leave', this.username,
                        getUsersArray(userList, this.room));
                }
                cb && cb();
            })

            .on('change code', function(code, cb) {
                var self = this;
                collection.update({url: this.room}, { $set: {code: code} }, function(err, result) {
                    if (err) throw err;
                    socket.broadcast.to(self.room).emit('change code', code);
                    cb && cb();
                });
            })

            .on('change rights', function(userID, room, emit) {
                // отправить конкретным сокетам по socketID
                var l = userList[userID][room].socketID.length,
                    socketIDList = userList[userID][room].socketID;
                for (var i = 0; i < l; i += 1){
                    io.to(socketIDList[i]).emit('change rights', emit);
                }
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
    var usersInRoom = [];
    for (var item in userList) {
        if (userList[item][room])
        //if (readOnly === 'admin') {
            usersInRoom.push({
                "userID": item,
                "username": userList[item][room].username,
                "readOnly": userList[item][room].readOnly
            });
        //}
        //else if (userList[item][room]) {
        //    usersInRoom.push({
        //        "username": userList[item][room].username
        //    });
        //}
    }
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
