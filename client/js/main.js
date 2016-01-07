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
  document.getElementById('startMenuWrapper').style.display = 'none';
  document.getElementById('gameAreaWrapper').style.display = 'block';
  
  if(!socket){
    socket = io();
    setupSocket(socket);
    
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
}

window.onload = function() { 
  
  var startBtn = document.getElementById('startButton');
  var nickErrorText = document.querySelector('#startMenu .input-error');
  
  startBtn.onclick = function () {
    //TODO Verify Account
    startGame();
  };
};

$('form').submit(function(){
  socket.emit('chat message', $('#m').val());
  $('#m').val('');
  return false;
});

function setupSocket(socket){
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