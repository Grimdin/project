/**
 * Created by jenia0jenia on 25.03.2015.
 */

var mongoose = require('mongoose');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);

var sessionStore = new MongoStore({mongooseConnection: mongoose.connection});

module.exports = sessionStore;