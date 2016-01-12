/* Modules */
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
//var passport = require('passport');
//var LocalStrategy = require('passport-local').Strategy;
//var CustomStrategy = require('passport-custom').Strategy
var jwt = require('jsonwebtoken');
var socketioJwt = require('socketio-jwt');
//var socketAuth = require('socketio-auth');
var morgan = require('morgan');  
var bodyParser = require('body-parser');


var model = require('./js/model.js');
var util = require('./js/util.js');

/* Configuration */
app.use(express.static(__dirname + '/../client'));
app.use(morgan('dev'));  
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

var UserDB = model.UserProvider;
//TODO: Create configuration file
var jwtSecret = 'butts';
var jwtExpire = 60*5;

/* Router */
app.post('/login', function(req, res) {
  UserDB({username: req.body.username}).authenticate(req.body.password, function(err, user, passErr){
    if(err || passErr){
      res.json({success: false, err: (err || passErr)});
    } else {
      var token = jwt.sign(user, jwtSecret, { expiresIn: jwtExpire });
      res.json({token: token});
    }
  });
});

app.post('/register', function(req, res) {
  UserDB.register(new UserDB({ username : req.body.username }), req.body.password, function(err, user){
    if(err){
      res.json({success: false, err: err});
    } else {
      res.json({success: true});
    }
  });
});

app.get('/', function(req, res){
  res.sendfile('index.html');
});

/* Game Variables */
var playerList = [];
var sockets = {};

/* Sockets */
io.use(socketioJwt.authorize({
  secret: jwtSecret,
  handshake: true
}));

io.on('connection', function(socket){
  console.log('a user connected');

  var currentPlayer = {
    id: socket.id
  };
  
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

/* Helper Functions */
function sendUpdates(){
  io.emit('serverTellPlayerMove', playerList);
}

function checkUserExists(){
  
}

function validateAccount(username, password){
  
}

setInterval(sendUpdates, 1000 / 40);

/* Application */
//TODO: Configure Ports
http.listen(3000, function(){
  console.log('listening on localhost:3000');
});