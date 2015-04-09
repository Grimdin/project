///**
// * Created by jenia0jenia on 01.04.2015.
// */
//// Use connect method to connect to the Server
//
var url = 'mongodb://heroku_app35631916:b1pggvtfcfr0p0g4i41uq9cm59@dbh42.mongolab.com:27427/heroku_app35631916';
var monk = require('monk');
var db = monk(url);
var collection = db.get('documents');
module.exports = collection;