///**
// * Created by jenia0jenia on 01.04.2015.
// */
//// Use connect method to connect to the Server
//
var url = 'mongodb://admin:4ernenk0@ds055699.mongolab.com:55699/documents';
var monk = require('monk');
var db = monk(url);
var collection = db.get('documents');
module.exports = collection;