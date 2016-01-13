/* Modules */
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var jwt = require('jsonwebtoken');
var socketioJwt = require('socketio-jwt');
var morgan = require('morgan');  
var bodyParser = require('body-parser');

var model = require('./js/model.js');
var util = require('./js/util.js');
var c = require('./config.json');

/* Configuration */
app.use(express.static(__dirname + '/../client'));
app.use(morgan('dev'));  
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var UserDB = model.UserProvider;
var PlayerDB = model.PlayerProvider;
var port = process.env.PORT || c.port;
var jwtSecret = c.jwtSecret;
var jwtExpireIn = c.jwtExpireIn;
var minChar = 4;
var maxChar = 20;

/* Router */
app.post('/login', function(req, res) {
  validateAccount(req.body.username, req.body.password, function(err){
    if(err){
      res.json({success: false, reason: err});
    } else {
      UserDB({username: req.body.username}).authenticate(req.body.password, function(err, user, passErr){
        if(err || passErr){
          res.json({success: false, reason: (err || passErr)});
        } else {
          var token = jwt.sign({ 'username' : req.body.username }, jwtSecret, { expiresIn: jwtExpireIn });
          res.json({success: true, token: token});
      }
    });  
    }
  });
});

app.post('/register', function(req, res) {
  validateAccount(req.body.username, req.body.password, function(err){
    if(err){
      res.json({success: false, reason: err});
    } else {
      UserDB.register(new UserDB({ username : req.body.username }), req.body.password, function(err, user){
        if(err){
          res.json({success: false, reason: err});
        } else {
          //Create Account Information
          res.json({success: true});
        }
      });
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
io.on('connection', socketioJwt.authorize({
    secret: jwtSecret,
    timeout: 15000
  })).on('authenticated', function(socket) {
  console.log('a user connected');
  console.log('hello! ' + JSON.stringify(socket.decoded_token));

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

function validateAccount(username, password, cb){
  if(username.length < minChar || username.length > maxChar){
    return cb({message: "Username must be between " + minChar + " and " + maxChar + " characters"});
  } else if(password.length < minChar || password.length > maxChar) {
    return cb({message: "Password must be between " + minChar + " and " + maxChar + " characters"});
  } else if(!alphaNumeric(username) || !validPassword(password)){
    return cb({message: "Alphanumerical characters only"});
  } else {
    return cb(null);
  }
}

function alphaNumeric(str){
  return /[^a-zA-Z0-9]/.test(str) ? false : true;
}

function validPassword(str){
  return /^[a-zA-Z0-9!@#$%&*]+$/.test(str) ? true : false;
}

setInterval(sendUpdates, 1000 / 40);

/* Application */
http.listen(port, function(){
  console.log('listening on localhost:' + port);
});
