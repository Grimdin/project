/**
 * Created by jenia0jenia on 20.03.2015.
 */

var crypto = require('crypto');
var mongoose = require('lib/mongoose'),
    Schema = mongoose.Schema;
var async = require('async');

var schema = new Schema ({
    username: {
        type: String,
        unique: true,
        required: true
    },
    hashedPassword: {
        type: String,
        required: true
    },
    salt: {
        type: String,
        required: true
    },
    created: {
        type: Date,
        default: Date.now
    },
    mode: {
        type: Number,
        default: 0
    }
});

schema.methods.encryptPassword = function(password) {
    return crypto.createHmac('sha1', this.salt).update(password).digest('hex');
};

schema.virtual('password')
    .set(function(password) {
        this._plainPassword = password;
        this.salt = Math.random() + '';
        this.hashedPassword = this.encryptPassword(password);
    })
    .get(function() { return this._plainPassword; });


schema.methods.checkPassword = function(password) {
    return this.encryptPassword(password) === this.hashedPassword;
};

schema.statics.authorize = function(username, password, callback) {
    var User = this;
    //username = 'user2223';
    async.waterfall([
        function(callback) {
            User.findOne({username: username}, callback);
        },
        function(user, callback) {
            if (user) {
                if (user.checkPassword(password)) {
                    callback(null, user);
                } else {
                    callback(403); // нужно отправить ошибку авторизации
                }
            } else {
                callback(null, user);
            }
        }
    ], callback);

};

module.exports.User = mongoose.model('User', schema);

