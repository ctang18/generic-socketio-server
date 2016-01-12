var mongoose = require('mongoose');
var passportLocalMongoose = require('passport-local-mongoose');
var uriString = process.env.MONGOLAB_URI || 'mongodb://localhost/raiders'
var connection = mongoose.createConnection(uriString);

var Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;

/* Schemas */
var userSchema = new Schema({
  email : String
});

var playerSchema = new Schema({
  userid   : ObjectId,
  username : String,
  position : {
    x : Number,
    y : Number
  }
});

/* Users */
userSchema.plugin(passportLocalMongoose);
var UserProvider = connection.model('User', userSchema);

/* Player Characters */
var PlayerProvider = function(){};

exports.UserProvider = UserProvider;
exports.PlayerProvider = PlayerProvider;