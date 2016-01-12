var socket;

/* Game Variables */
var player = {
  id: -1,
  name: "",
  x: Math.round(Math.random() * 599),
  y: Math.round(Math.random() * 299)
};

var playerList = [];
var playerRenders = [];

function startGame(){
  document.getElementById('loginMenuWrapper').style.display = 'none';
  document.getElementById('gameAreaWrapper').style.display = 'block';
  
  player.name = "" + Math.round(Math.random() * 360);

  Crafty.init(600, 300, document.getElementById('game'));
  Crafty.background('rgb(127,127,127)');
  var playerRender = Crafty.e('2D, Canvas, Color, Text, Fourway')
    .attr({x: player.x, y: player.y, w:50, h:50})
    .color('yellow')
    .text(player.name)
    .textFont({ size: '20px' })
    .fourway(50);

  console.log(playerRender.getId());
  playerRender.id = 12;
  console.log(playerRender.getId());
  socket.emit('joined', player);  
}



window.onload = function() { 
  
  var startBtn = document.getElementById('startButton');
  var createAccountBtn = document.getElementById('createAccountButton');
  var registerBtn = document.getElementById('registerButton');
  var cancelRegisterBtn = document.getElementById('cancelRegisterButton');
  //var nickErrorText = document.querySelector('#startMenu .input-error');
  
  /*if(!socket){
    socket = io();
    setupSocket(socket);
  }*/

  /*startBtn.onclick = function() {
    //TODO Verify Account
    console.log("login press");
    var accountInfo = {
      username : document.getElementById('playerUsernameInput').value,
      password : document.getElementById('playerPasswordInput').value
    };
    socket.emit('login', accountInfo);
  };*/
  
  createAccountBtn.onclick = function() {
    console.log("create account");
    document.getElementById('loginMenuWrapper').style.display = 'none';
    document.getElementById('registerWrapper').style.display = 'block';
  };
  
  cancelRegisterBtn.onclick = function() {
    console.log("cancel register");
    document.getElementById('loginMenuWrapper').style.display = 'block';
    document.getElementById('registerWrapper').style.display = 'none';
  };
  
  registerBtn.onclick = function() {
    //TODO Client-side validation
    var accountInfo = {
      username : document.getElementById('regUsernameInput').value,
      password : document.getElementById('regPasswordInput').value
    };
    socket.emit('register', accountInfo);
  };
};

$('#loginButton').click(function (e) {
  e.preventDefault();
  $.post('login', {
    username: document.getElementById('playerUsernameInput').value,
    password: document.getElementById('playerPasswordInput').value
  }).done(function (result) {
    //connect_socket(result.token);
    //socket = io();
    //setupSocket(socket);
    socket = io.connect('http://localhost:3000', {
      query: 'token=' + result.token,
      forceNew: true
    });
    setupSocket(socket);
    startGame();
  });
});

function setupSocket(socket){
  socket.on('connect', function(data){
    console.log('connected');
    startGame();
  });
  
  socket.on('register success', function(){
    console.log('register success');
    document.getElementById('loginMenuWrapper').style.display = 'block';
    document.getElementById('registerWrapper').style.display = 'none';
  });
  
  socket.on('register fail', function(msg){
    $('#messages').append($('<li>').text("Register Failed: " + msg));
  });
  
  socket.on('login success', function(data){
    startGame();
  });
  
  socket.on('login fail', function(msg){
    $('#messages').append($('<li>').text("Login Failed: " + msg));
  });
  
  socket.on('chat message', function(msg){
    $('#messages').append($('<li>').text(msg));
  });
  
  socket.on('player join', function(playerName){
    $('#messages').append($('<li>').text(playerName+ " has connected."));
  });
  
  socket.on('player left', function(playerName){
    $('#messages').append($('<li>').text(playerName + " has disconnected."));
  });
  
  socket.on('serverTellPlayerMove', function(playerList){
    this.playerList = playerList;
    //Crafty(1).shift(1,1,0,0);
  });
}

function drawPlayers(){
  
}