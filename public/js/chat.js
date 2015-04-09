/**
 * Created by jenia0jenia on 24.03.2015.
 */

$(function() {

    var editor = ace.edit("editor");
    var session = editor.getSession();
    editor.setTheme("ace/theme/textmate");
    session.setUseWrapMode(true);
    session.setUseWorker(false);
    session.setMode("ace/mode/javascript");
    var FADE_TIME = 150; // ms
    var TYPING_TIMER_LENGTH = 400; // ms
    var form = $('#chat form')
        , ul = $('#chat ul')
        , input = $('#chat input')
        , users = $('#list')
        , user = {}
        , trigger
        , ignoreAceChange = true;

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
            initialization();
        })

        .on('disconnect', function() {
            printStatus("соединение потеряно");
            form.off('submit', sendMessage);
            input.prop('disabled', true);
        })

        .on('change code', function(code){
            changeCode(code);
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

    function initialization() {
        input.prop('disabled', false);
        form.on('submit', sendMessage);
        editor.$blockScrolling = Infinity;
        //editor.setReadOnly(true);
        ignoreAceChange = false;
        editor.on("change", function() {
            var code = session.getValue();
            if (!ignoreAceChange) {
                console.log('ace editor chang');
                setTimeout(function () {
                    socket.emit('change code', session.getValue());
                }, 500);
            }
            //console.log(editor.$blockScrolling);
        });
    }

    function changeCode(newCode) {
        var currentCode = session.getValue();
        if (newCode !== currentCode) {
            console.log('new code comes');
            //console.log(newCode !== session.getValue());
            ignoreAceChange = true;
            session.setValue(newCode);
        }
        ignoreAceChange = false;
    }

    function showUsers(userList){
        users.text(userList);
    }
}());