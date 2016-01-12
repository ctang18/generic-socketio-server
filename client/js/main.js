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

/* Document */
$('#createAccountButton').click(function (e) {
  e.preventDefault();
  document.getElementById('loginMenuWrapper').style.display = 'none';
  document.getElementById('registerWrapper').style.display = 'block';
});

$('#cancelRegisterButton').click(function (e) {
  e.preventDefault();
  document.getElementById('loginMenuWrapper').style.display = 'block';
  document.getElementById('registerWrapper').style.display = 'none';
});

$('#loginButton').click(function (e) {
  e.preventDefault();
  var username = $('#playerUsernameInput').val();
  var password = $('#playerPasswordInput').val();
  
  if(validateLogin(username, password)){
    $.post('login', {
      username: username,
      password: password
    }).done(function (result) {
      if(result.success){
        socket = io.connect('http://localhost:3000', {
          query: 'token=' + result.token,
          forceNew: true
        });
        setupSocket(socket);
      } else {
        $('#loginError').html(result.err.message);
        $('#loginError').css("visibility", "visible");
      }
    });
  }
});

$('#registerButton').click(function (e) {
  var username = $('#regUsernameInput').val();
  var password = $('#regPasswordInput').val();
  var confirm = $('#regConfirmInput').val();
  
  e.preventDefault();
  if(validateRegistration(username, password, confirm)){
    $.post('register', {
      username: username,
      password: password
    }).done(function (result) {
      if(result.success){
        document.getElementById('loginMenuWrapper').style.display = 'block';
        document.getElementById('registerWrapper').style.display = 'none';
      } else {
        $('#registerError').html(result.err.message);
        $('#registerError').css("visibility", "visible");
      }
    });
  }
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

function validateRegistration(username, password, confirm){ 
  if(username.length < 4 || username.length > 20){
    $('#registerError').html("Username must be between 4 and 20 characters");
  } else if(password.length < 4 || password.length > 20) {
    $('#registerError').html("Password must be between 4 and 20 characters");
  } else if(password != confirm){
    $('#registerError').html("Passwords must match");
  } else if(!alphaNumeric(username) || !alphaNumeric(password)){
    $('#registerError').html("Alphanumerical characters only");
  } else {
    return true;
  }
  $('#registerError').css("visibility", "visible");
  return false;
}

function validateLogin(username, password){
  if(username.length < 4 || username.length > 20){
    $('#loginError').html("Username must be between 4 and 20 characters");
  } else if(password.length < 4 || password.length > 20) {
    $('#loginError').html("Password must be between 4 and 20 characters");
  } else if(!alphaNumeric(username) || !alphaNumeric(password)){
    $('#loginError').html("Alphanumerical characters only");
  } else {
    return true;
  }
  $('#loginError').css("visibility", "visible");
  return false;
}

function alphaNumeric(str){
  return /[^a-zA-Z0-9]/.test(str) ? false : true;
}