/**
 * Created by jenia0jenia on 20.03.2015.
 */
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/chat');

module.exports = mongoose;