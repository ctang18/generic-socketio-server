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
  
  var createAccountBtn = document.getElementById('createAccountButton');
  var cancelRegisterBtn = document.getElementById('cancelRegisterButton');
  
  createAccountBtn.onclick = function() {
    document.getElementById('loginMenuWrapper').style.display = 'none';
    document.getElementById('registerWrapper').style.display = 'block';
  };
  
  cancelRegisterBtn.onclick = function() {
    document.getElementById('loginMenuWrapper').style.display = 'block';
    document.getElementById('registerWrapper').style.display = 'none';
  };
};

$('#loginButton').click(function (e) {
  e.preventDefault();
  $.post('login', {
    username: document.getElementById('playerUsernameInput').value,
    password: document.getElementById('playerPasswordInput').value
  }).done(function (result) {
    socket = io.connect('http://localhost:3000', {
      query: 'token=' + result.token,
      forceNew: true
    });
    setupSocket(socket);
  });
});

$('#registerButton').click(function (e) {
  e.preventDefault();
  validateRegistration();
  $.post('register', {
    //TODO: Confirm passwords
    username: document.getElementById('regUsernameInput').value,
    password: document.getElementById('regPasswordInput').value
  }).done(function (result) {
    if(result.success){
      document.getElementById('loginMenuWrapper').style.display = 'block';
      document.getElementById('registerWrapper').style.display = 'none';
    } else {
      console.log('Register Fail: ' + result.err);
    }
  });
});

/* Helper Functions */
function setupSocket(socket){
  socket.on('connect', function(data){
    console.log('connected');
    startGame();
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

function validateRegistration(){
  var username = $('#regUsernameInput').val();
  var password = $('#regPasswordInput').val();
  var confirm = $('#regConfirmInput').val();
  
  if(password != confirm){
    $('#registerError').html("Passwords must match");
    $('#registerError').css("visibility", "visible");
    console.log("passwords must match");
    return false;
  }
}