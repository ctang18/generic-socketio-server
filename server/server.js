/* Modules */
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var mongoose = require('mongoose');
var uriString = process.env.MONGOLAB_URI || 'mongodb://localhost/myapp'
var connection = mongoose.createConnection(uriString);

var model = require('./js/model.js');
var util = require('./js/util.js');

/* Configuration */
app.use(express.static(__dirname + '/../client'));

var UserDB = model.User;
passport.use(new LocalStrategy(UserDB.authenticate()));
passport.serializeUser(UserDB.serializeUser());
passport.deserializeUser(UserDB.deserializeUser());

/* Router */
app.get('/', function(req, res){
  res.sendfile('index.html');
});

/* Game Variables */

var playerList = [];
var sockets = {};

/* Sockets */
io.on('connection', function(socket){
  console.log('a user connected');

  var currentPlayer = {
    id: socket.id
  };
  
  socket.on('register', function(account){
    console.log('Registering ' + account.accountName);
    console.log('Register success');
    console.log('Register fail');
  });
    
  socket.on('joined', function(player){
    io.emit('player join', player.name);
    console.log('[INFO] User ' + player.name + ' joined!');
    currentPlayer = player;
    playerList.push(currentPlayer);
  });
  
  socket.on('disconnect', function(){
    if (util.findIndex(playerList, currentPlayer.id) > -1){
      playerList.splice(util.findIndex(playerList, currentPlayer.id), 1);
      io.emit('player left', currentPlayer.name);
      console.log('[INFO] User ' + currentPlayer.name + ' disconnected!');
    }
  });

  socket.on('chat message', function(msg){
    io.emit('chat message', msg);
  });
});

function sendUpdates(){
  io.emit('serverTellPlayerMove', playerList);
}

setInterval(sendUpdates, 1000 / 40);

/* Application */
//TODO: Configure Ports
http.listen(3000, function(){
  console.log('listening on localhost:3000');
});