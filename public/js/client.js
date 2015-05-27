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
    var url = window.location.href.split('/').pop();
    var socket = io.connect();
    // Prompt for setting a username
    var typing = false;
    var lastTypingTime;

    socket
        .on('message', function (username, message) {
            printMessage(username + '> ' + message);
        })

        .on('leave', function(username, userList) {
            printStatus(username + " вышел из чата");
            showUsers(userList, user.readOnly);
        })

        .on('join', function(username, userList) {
            printStatus(username + " вошёл в чат");
            showUsers(userList, user.readOnly);
        })

        .on('connect', function() {
            printStatus("соединение установлено");
            user = { username: $.cookie('username'), userID: $.cookie('userID'), room: url, readOnly: true };
            if (!user.userID) {
                bootbox.prompt({
                    title: "What is you\'re name?",
                    value: "Student",
                    callback: function(result){
                        user.username = result || 'Anonymous';
                        user.userID = Math.random();
                        $.cookie('username', user.username);
                        $.cookie('userID', user.userID);
                        $.cookie('userID', user.userID);
                        socket.emit('add user', user, function(userList){
                            initialization(userList);
                        });
                    }
                });
            } else {
                socket.emit('add user', user, function(userList){
                    initialization(userList);
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
        })

        .on('change rights', function(emit){
            if (emit === true) {
                editor.setReadOnly(emit);
            } else if (emit === false) {
                editor.setReadOnly(emit);
            } else if (emit === 'disconnect') {
                alert ('Вы были отключены администратором!')
            }
            //console.log(emit);
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

    function initialization(userList) {
        userList.forEach(function(oneUser) {
            if (user.userID === oneUser.userID) user.readOnly = oneUser.readOnly;
        });
        // отображаем список участников
        showUsers(userList, user.readOnly);
        // выставляем права на редактирование кода
        if (user.readOnly === 'admin' || !user.readOnly) {
            editor.setReadOnly(false);
        } else {
            editor.setReadOnly(true)
        }
        input.prop('disabled', false);
        form.on('submit', sendMessage);
        ignoreAceChange = false;
        editor.on("change", function() {
            var code = session.getValue();
            if (!ignoreAceChange) {
                setTimeout(function () {
                    socket.emit('change code', session.getValue());
                }, 500);
            }
        });
    }

    function changeCode(newCode) {
        var currentCode = session.getValue();
        if (newCode !== currentCode) {
            ignoreAceChange = true;
            session.setValue(newCode);
        }
        ignoreAceChange = false;
    }

    function showUsers(userList, readOnly){
        //console.log(userList, 'and', readOnly)
        var html = '';
        if (readOnly === 'admin'){
            userList.forEach(function(user, i, userList) {
                html += '<a class="menu" id="'+ userList[i].userID +'">' + user.username + '</a>' + ', ';
            });
            html = html.slice(0, html.length - 2);
            list.html(html);
            $('.menu').click(function() {
                var clickedUserID = this.id;
                bootbox.dialog({
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
                            label: "Установить права на редактирование",
                            className: "btn-success",
                            callback: function() {
                                setRight(clickedUserID, false)
                            }
                        },
                        "Danger!": {
                            label: "Установить права только на чтение",
                            className: "btn-danger",
                            callback: function() {
                                setRight(clickedUserID, true)
                            }
                        },
                        "Disconnect!": {
                            label: "Отключить участника",
                            className: "btn-danger",
                            callback: function() {
                                setRight(clickedUserID, 'disconnect')
                            }
                        }
                    }})
            } );
        } else {
            userList.forEach(function(user) {
                html += user.username + ', ';
            });
            html = html.slice(0, html.length - 2);
            list.text(html);
        }
    }

    document.getElementById('lang').onchange = function() {
        var lang = $( "#lang option:selected").text();
        session.setMode("ace/mode/" + lang);
        editor.focus();
        var count = session.getLength();
        editor.gotoLine(count, session.getLine(count-1).length);
    };

    function setRight(userID, emit) {
        //console.log('set rights');
        return socket.emit('change rights', userID, url, emit);
    }

}());