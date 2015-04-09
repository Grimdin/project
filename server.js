#!/usr/bin/env node

/**
 * Module dependencies.
 */

var app = require('./app');
var http = require('http');

/**
 * Get port from environment and store in Express.
 */

var port = process.env.port || '3000';

app.set('port', port);

/**
 * Create HTTP server.
 */

var server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port, function() {
    //console.log('Server listening at port %d', port);
});

// socket.io
var io = require('./socket')(server);
app.set('io', io);