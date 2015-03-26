/**
 * Created by jenia0jenia on 24.03.2015.
 */
var socket = io.connect();

var form = $('#chat form')
    , ul = $('#chat ul')
    , input = $('#chat input');

socket
    .on('message', function (username, message) {
        printMessage(username + '> ' + message);
    })

    .on('leave', function(username) {
        printStatus(username + " вышел из чата");
    })

    .on('join', function(username) {
        printStatus(username + " вошёл в чат");
    })

    .on('connect', function() {
        printStatus("соединение установлено");
        form.on('submit', sendMessage);
        input.prop('disabled', false);

    })

    .on('disconnect', function() {
        printStatus("соединение потеряно");
        form.off('submit', sendMessage);
        input.prop('disabled', true);
        //setTimeout(reconnect, 500);
        this.emit('error');
    })

    .on('logout', function() {
        location.href = "/";
    })

    .on('error', function(reason) {
        //           if (reason == "handshake unauthorized") {
        //              printStatus("вы вышли из сайта");
        //           } else {
        setTimeout(function () {
            socket.connect();
        }, 500);
        //           }
    });

function reconnect() {
    socket.once('error', function() {
        setTimeout(reconnect, 500);
    });
    socket.connect();
}

function sendMessage() {
    var text = input.val();
    socket.emit('message', text, function() {
        printMessage("я> " + text);
    });
    input.val('');
    return false;
}

function printStatus(status) {
    $('<li>').append($('<i>').text(status)).appendTo(ul);
}

function printMessage(text) {
    $('<li>').text(text).appendTo(ul);
}