'use strict'
/**
 * Created by jenia0jenia on 24.03.2015.
 */
$(function() {
    var editor = ace.edit("editor");
    var session = editor.getSession();
    editor.setOption("enableEmmet", true);
    editor.setTheme("ace/theme/textmate");
    session.setMode("ace/mode/javascript");
    editor.$blockScrolling = Infinity;
    session.setUseWrapMode(true);
    session.setUseWorker(false);

    var FADE_TIME = 150; // ms
    var TYPING_TIMER_LENGTH = 400; // ms
    var form = $('#chat form')
        , ul = $('#chat ul')
        , input = $('#chat input')
        , list = $('#list')
        , user = {}
        , ignoreAceChange = true;

    var socket = io.connect();
    // Prompt for setting a username
    var typing = false;
    var lastTypingTime;

    socket
        .on('message', function (username, message) {
            printMessage(username + '> ' + message);
        })

        .on('leave', function(username, userList) {
            //console.log('has leave');
            printStatus(username + " вышел из чата");
            showUsers(userList);
        })

        .on('join', function(username, userList) {
            printStatus(username + " вошёл в чат");
            showUsers(userList);
        })

        .on('connect', function() {
            printStatus("соединение установлено");
            var url = window.location.href.split('/').pop();
            user = { username: $.cookie('username'), userID: $.cookie('userID'), room: url };
            //console.log(user);
            if (!user.userID) {
                bootbox.prompt({
                    title: "What is you\'re name?",
                    value: "Student",
                    callback: function(result){
                        user.username = result || 'Anonymous';
                        user.userID = Math.random();
                        $.cookie('username', user.username);
                        $.cookie('userID', user.userID);
                        socket.emit('add user', user, function(userList){
                            console.log('user list', userList[user.userID].username);
                            showUsers(userList);
                            initialization(userList[user.userID].readOnly);
                        });
                    }
                });
            } else {
                socket.emit('add user', user, function(userList){
                    console.log('user list', userList[user.userID].username);
                    showUsers(userList);
                    initialization(userList[user.userID].readOnly);
                });
            }
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
        text && socket.emit('message', text);
        input.val('');
        return false;
    }

    function printStatus(status) {
        ul.prepend($('<li>').append($('<i>').text(status)));
    }

    function printMessage(text) {
        ul.prepend($('<li>').text(text));
    }

    function initialization(readOnly) {
        input.prop('disabled', false);
        form.on('submit', sendMessage);
        readOnly === 'admin' ? editor.setReadOnly(false) : editor.setReadOnly(true);
        ignoreAceChange = false;
        editor.on("change", function() {
            var code = session.getValue();
            if (!ignoreAceChange) {
                //console.log('ace editor chang');
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
            //console.log('new code comes');
            //console.log(newCode !== session.getValue());
            ignoreAceChange = true;
            session.setValue(newCode);
        }
        ignoreAceChange = false;
    }

    function showUsers(userList){
        var html = '';
        if (userList[user.userID].readOnly === 'admin') {
            for (var i in userList) {
                html += '<a class="menu">' + userList[i].username + '</a>' + ', ';
            }
            html = html.slice(0, html.length - 2);
            list.html(html);
            $('.menu').click(function() { bootbox.dialog({
                message: "Options",
                title: "What do you want...",
                onEscape: function() {},
                show: true,
                backdrop: true,
                closeButton: true,
                animate: true,
                className: "my-modal",
                buttons: {
                    success: {
                        label: "Set write option",
                        className: "btn-success",
                        callback: setRight
                    },
                    "Danger!": {
                        label: "Set read-only",
                        className: "btn-danger",
                        callback: setRight
                    },
                    "Another label": {
                        label: "Cancel",
                        className: "btn-primary",
                        callback: setRight
                    }
                }
            }) } );
        } else {
            for (i in userList) {
                html += userList[i].username + ', ';
            }
            html = html.slice(0, html.length - 2);
            list.text(html);
        }
        //console.log('i\'ll show you users list', userList);
    }

    document.getElementById('lang').onchange = function() {
        var lang = $( "#lang option:selected").text();
        session.setMode("ace/mode/" + lang);
        //console.log(lang);
        editor.focus();
        var count = session.getLength();
        editor.gotoLine(count, session.getLine(count-1).length);
    };

    function setRight() {
        user.readOnly = true;
        editor.setReadOnly(false);
        //socket.emit('change rights', );
        return;
    }

}());