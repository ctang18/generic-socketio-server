/* Modules */
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var CustomStrategy = require('passport-custom').Strategy
var jwt = require('jsonwebtoken');
var socketioJwt = require('socketio-jwt');
var socketAuth = require('socketio-auth');
var morgan = require('morgan');  

var model = require('./js/model.js');
var util = require('./js/util.js');

/* Configuration */
app.use(express.static(__dirname + '/../client'));
app.use(morgan('dev'));  


//app.use(passport.initialize());
//app.use(passport.session());

var UserDB = model.UserProvider;
//passport.use(new LocalStrategy(UserDB.authenticate()));
/*
passport.use(new LocalStrategy(function(username, password, done) {
  console.log('checking for ' + username);
  UserDB.findOne({ username: username }, function (err, user) {
    if (err) { return done(err); }
    if (!user) { return done(null, false); }
    if (!user.verifyPassword(password)) { return done(null, false); }
    return done(null, user);
  });
}));
*/

//passport.serializeUser(UserDB.serializeUser());
//passport.deserializeUser(UserDB.deserializeUser());

/* Router */
app.post('login', function(req, res) {
    var profile = {
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@doe.com',
    id: 123
  };

  // we are sending the profile in the token
  var token = jwt.sign(profile, 'butts', { expiresInMinutes: 60*5 });

  res.json({token: token});
});
app.get('/', function(req, res){
  res.sendfile('index.html');
});

/* Game Variables */
var playerList = [];
var sockets = {};

/* Sockets */
//TODO setup secret key

require('socketio-auth')(io, { 
  authenticate: function (socket, data, callback) {
    //get credentials sent by the client
    var username = data.username;
    var password = data.password;
    
    UserDB.findUser('User', {username:username}, function(err, user) {
      //inform the callback of auth success/failure
      if (err || !user) return callback(new Error("User not found"));
      return callback(null, user.password == password);
    })
  }
});

io.on('connection', function(socket){
  console.log('a user connected');

  var currentPlayer = {
    id: socket.id
  };
  
  socket.on('register', function(account){
    console.log('Registering ' + account.username);
    var newAccount = new UserDB(account);
    newAccount.save(function (err, user) {
      if (err) {
        console.log('Register fail: ' + err);
        socket.emit('register fail', err);
      } else {
        console.log('Register success');
        socket.emit('register success');
      }
    });
    /*
    UserDB.register(new UserDB({ username : account.username }), account.password, function(err, account) {
      if (err) {
        //TODO Send back errors
        console.log('Register fail: ' + err);
        socket.emit('register fail', err);
      } else {
        console.log('Register success');
        socket.emit('register success');
      }
    });*/
    //TODO create player data
  });
  
  socket.on('login', function(account){
    console.log('Logging in as ' + account.username);
    /*
    passport.authenticate('local', function(err, user) {
      console.log('authenticating');
      if (err) { 
        console.log('Login fail: ' +  err);
        socket.emit('login fail', err)
      }
      if (!user) {
        console.log('Login fail');
        socket.emit('login fail', 'cannot find user')
      }
      console.log('Login success');
      //TODO return player data
      var data;
      socket.emit('login success', data);
    });*/
    
    UserDB.findOne({'username' : account.username}, function (err, user) {
      if (err) { 
        console.log('Login fail: ' +  err);
        socket.emit('login fail', err)
      }
      else {
        if(user.authenticate(account.password)){
          socket.emit('login success', user);
        } else {
          console.log('Login fail');
          socket.emit('login fail', 'cannot find user')
        };
      }
    });
    console.log('finish login check');
    
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