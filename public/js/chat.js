/**
 * Created by jenia0jenia on 24.03.2015.
 */

$(function() {


    var FADE_TIME = 150; // ms
    var TYPING_TIMER_LENGTH = 400; // ms
    var form = $('#chat form')
        , ul = $('#chat ul')
        , input = $('#chat input')
        , users = $('#list')
        , textarea = $('#textarea')
        , user = {};
    textarea.on('cut paste keyup', inputCode);
    var socket = io.connect();
    // Prompt for setting a username
    var connected = false;
    var typing = false;
    var lastTypingTime;

    socket
        .on('message', function (username, message) {
            printMessage(username + '> ' + message);
        })

        .on('leave', function(username, userList) {
            printStatus(username + " вышел из чата");
            showUsers(userList);
        })

        .on('join', function(username, userList) {
            printStatus(username + " вошёл в чат");
            showUsers(userList);
        })

        .on('connect', function() {
            printStatus("соединение установлено");
            user = { username: $.cookie('username'), userID: $.cookie('userID') };
            if (!user.userID) {
                user.username = prompt('what is you\'re name?', 'Student') || 'Anonymous';
                user = { username: user.username, userID: Math.random() };
                $.cookie('username', user.username);
                $.cookie('userID', user.userID);
                //console.log('was created new user');
            }
            socket.emit('add user', user, function(userList){
                //console.log('user list', userList);
                showUsers(userList);
            });
            form.on('submit', sendMessage);
            input.prop('disabled', false);
        })

        .on('disconnect', function() {
            printStatus("соединение потеряно");
            form.off('submit', sendMessage);
            input.prop('disabled', true);
        })

        .on('change code', function(text){
            changeCode(text);
        });

    function sendMessage() {
        var text = input.val();
        text && socket.emit('message', text, function() {
            //printMessage("я> " + text);
        });
        input.val('');
        return false;
    }

    function printStatus(status) {
        ul.prepend($('<li>').append($('<i>').text(status)));
    }

    function printMessage(text) {
        ul.prepend($('<li>').text(text));
    }

    function inputCode() {
    var code = textarea.val();
        socket.emit('change code', code);
    }

    function changeCode(text) {
        textarea.val(text);
    }

    function showUsers(userList){
        users.text(userList);
    }
}());



