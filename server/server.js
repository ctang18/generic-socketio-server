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
var PlayerDB = new model.PlayerProvider;
var port = process.env.PORT || c.port;
var jwtSecret = c.jwtSecret;
var jwtExpireIn = c.jwtExpireIn;
var jwtAuthTime = c.jwtAuthTime;
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
          //TODO: Roll own Mongoose plugin where on UserDB.register player data is created as well
          //Situation may arise that a user is created but not player
          PlayerDB.createPlayer(req.body.username, function(err, user){
            if(err){
              res.json({success: false, reason: err});
            } else {
              res.json({success: true});
            }
          });
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
    timeout: jwtAuthTime
  })).on('authenticated', function(socket) {
  console.log('a user connected');
  console.log('hello! ' + JSON.stringify(socket.decoded_token.username));
  
  var currentPlayer;
  var deltaX = 0;
  var deltaY = 0;
  
  PlayerDB.getPlayer(socket.decoded_token.username, function(err, player){
    if(err){
      console.log("Error finding player data: " + err);
    } else {
      socket.emit('player data', player);
      currentPlayer = player;
      currentPlayer.id = socket.id; 
      currentPlayer.lastUpdate = Date.now();
    }
  });
  
  var savePositionInterval = setInterval(function(){
    if(currentPlayer.username){
      savePosition(currentPlayer.username, deltaX, deltaY);
    }
  }, 10000); //30 seconds
  
  socket.on('joined', function(player){
    io.emit('player join', player.username);
    console.log('[INFO] User ' + player.username + ' joined!');
    currentPlayer = player;
    playerList.push(currentPlayer);
  });
  
  socket.on('client move', function(data){
    var now = Date.now();
    var then = currentPlayer.lastUpdate;
    var delta = (now - then) / 1000;
    var pspeed = 50;
    
    if (data.keys.indexOf('up') > -1) {
        deltaY -= pspeed * delta;
    }
    if (data.keys.indexOf('down') > -1) {
        deltaY += pspeed * delta;
    }
    if (data.keys.indexOf('left') > -1) {
        deltaX -= pspeed * delta;
    }
    if (data.keys.indexOf('right') > -1) {
        deltaX += pspeed * delta;
    }
    currentPlayer.lastUpdate = now;
  });
  
  socket.on('disconnect', function(){
	if (util.findIndex(playerList, currentPlayer.id) > -1){
	  playerList.splice(util.findIndex(playerList, currentPlayer.id), 1);
	  io.emit('player left', currentPlayer.name);
    clearInterval(savePositionInterval);
	  console.log('[INFO] User ' + currentPlayer.username + ' disconnected!');
	}
  });

  socket.on('chat message', function(msg){
    io.emit('chat message', msg);
  });
});

/* Helper Functions */
function sendUpdates(){
  //io.emit('serverTellPlayerMove', playerList);
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


function savePosition(username, deltaX, deltaY){
  console.log("saving player position");
  PlayerDB.updatePosition(username, deltaX, deltaY, function(err){
    if(err){
      console.log("error updating position");
    }
  });
}

//setInterval(sendUpdates, 1000); //1 second


/* Application */
http.listen(port, function(){
  console.log('listening on localhost:' + port);
});
