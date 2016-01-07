var mongoose = require('mongoose');
var passportLocalMongoose = require('passport-local-mongoose');
var uriString = process.env.MONGOLAB_URI || 'mongodb://localhost/myapp'
var connection = mongoose.createConnection(uriString);

var Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;

/* Schemas */
var userSchema = new Schema();

var playerSchema = new Schema({
  
});

/* Users */
userSchema.plugin(passportLocalMongoose);
var UserProvider = connection.model('User', userSchema);

/* Player Characters */
var PlayerProvider = function(){};

exports.UserProvider = UserProvider;
exports.PlayerProvider = PlayerProvider;