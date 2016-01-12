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

/* Configuration */
app.use(express.static(__dirname + '/../client'));
app.use(morgan('dev'));  
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

var UserDB = model.UserProvider;
//TODO: Create configuration file
var jwtSecret = 'butts';
var jwtExpire = 60*5;

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
          var token = jwt.sign(user, jwtSecret, { expiresIn: jwtExpire });
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

function validateAccount(username, password, cb){
  if(username.length < 4 || username.length > 20){
    return cb({message: "Username must be between 4 and 20 characters"});
  } else if(password.length < 4 || password.length > 20) {
    return cb({message: "Password must be between 4 and 20 characters"});
  } else if(!alphaNumeric(username) || !alphaNumeric(password)){
    return cb({message: "Alphanumerical characters only"});
  } else {
    return cb(null);
  }
}

function alphaNumeric(str){
  return /[^a-zA-Z0-9]/.test(str) ? false : true;
}

setInterval(sendUpdates, 1000 / 40);

/* Application */
//TODO: Configure Ports
http.listen(3000, function(){
  console.log('listening on localhost:3000');
});