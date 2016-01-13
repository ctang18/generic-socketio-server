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
  username : { type: String, unique: true },
  position : {
    x : Number,
    y : Number
  }
});

/* Users */
userSchema.plugin(passportLocalMongoose);
var UserProvider = connection.model('User', userSchema);

/* Player Characters */
var Player = connection.model('Player', playerSchema);
var PlayerProvider = function(){};

PlayerProvider.prototype.createPlayer = function(username, cb) {
  var position = { x: Math.round(Math.random() * 599),
    y: Math.round(Math.random() * 299) };
  var color = 'yellow';
  var player  = new Player({
    username : username,
    position : position,
    color    : color
  });
  
  player.save(function(err){
    console.log(err);
    cb(err);
  });
};

PlayerProvider.prototype.getPlayer = function(username, cb) {
	Player.find({ 'username': username }).exec(function(err, player) {
		cb(err, player);
	});
};

exports.UserProvider = UserProvider;
exports.PlayerProvider = PlayerProvider;
