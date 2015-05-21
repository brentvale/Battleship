var socketio = require('socket.io');

var waitingUsers = [];
var allUsers = {};
var gameNumber = 0;
var nicknames = {};
var currentGame = {};
var games = [];

var nextGuestName = (function () {
  var guestNumber = 1;
  return function () {
    guestNumber += 1;
    return "Guest" + guestNumber;
  };
}());

var createGame = function(p1, p2){
  waitingUsers = waitingUsers.slice(2);
  var nameOfGame = "Game-" + gameNumber.toString();
  var Game = {
    gameName: nameOfGame,
    waitingForShips: [p1.id, p2.id],
    readyPlayers: []
  };
  games.push(Game);
}

var joinGame = function (socket, io, gameName) {
  socket.join(gameName);
  currentGame[socket.id] = gameName;
  io.to(gameName).emit('placeShips', {
    text: "joined" + gameName
  })
};

var handlePlaceShips = function (socket, io){
  socket.on("shipsPlaced", function() {
    var targetGame = getTargetGame(socket.id);
    var socketIndex = targetGame.waitingForShips.indexOf(socket.id);

    switch(socketIndex){
    case 0:
      targetGame.waitingForShips.shift();
      break;
    case 1:
      targetGame.waitingForShips.pop();
      break;
    }
 
    targetGame.readyPlayers.push(socket);
    var otherSocket;
    var otherSocketId;
    if(targetGame.waitingForShips.length === 1){
      otherSocketId =  targetGame.waitingForShips[0];
      otherSocket = allUsers[otherSocketId];
      otherSocket.emit("youSuck");
      socket.emit("firstPlayer");
    } 
    if(targetGame.readyPlayers.length === 2){
      otherSocket =  targetGame.readyPlayers[0];
      otherSocket.emit("yourTurn");
      socket.emit("notYourTurn");
    }
  })
};

var getOtherPlayer = function(targetGame, socketId){
  var currentSocketIndex;
  //for var i < targetGame.readyPlayers.length which will always === 2
  for(var i = 0; i < 2; i ++){
    if(targetGame.readyPlayers[i].id === socketId){
      currentSocketIndex = i;
    }
  } 
  var otherSocket;
  switch(currentSocketIndex){
  case 0:
    otherSocket = targetGame.readyPlayers[1];
    break;
  case 1:
    otherSocket = targetGame.readyPlayers[0];
    break;
  }
  return otherSocket;
};

var getTargetGame = function (socketId) {
  var targetGame;
  for(var i = 0; i < games.length; i ++){
    if(games[i].gameName === currentGame[socketId]){
      targetGame = games[i];
    }
  }
  return targetGame;
};

var handleShot = function(socket, io){
  socket.on("HANDLE_SHOT_RESPONSE", function(coords) {
    var targetGame = getTargetGame(socket.id);
    var otherPlayer = getOtherPlayer(targetGame, socket.id);
    otherPlayer.emit("SHOT", coords);
  });
};

var handleShotResponse = function(socket, io){
  socket.on("SHOT_RESPONSE", function(params) {
    var targetGame = getTargetGame(socket.id);
    var otherPlayer = getOtherPlayer(targetGame, socket.id);
    
    if(params.gameLost){
      socket.emit("GAME_OVER", "you lose, saw that coming...");
      otherPlayer.emit("GAME_OVER", "you win!")
    } else {
      socket.emit("yourTurn");
      otherPlayer.emit("makeNotTurn", params);
    }
    
  })
};

var createGameServer = function (server) {
  var io = socketio.listen(server);

  io.sockets.on('connection', function (socket) {
    nicknames[socket.id] = nextGuestName();
    allUsers[socket.id] = socket;
    waitingUsers.push(socket);
    
    if(waitingUsers.length > 1){
      var p1 = waitingUsers[0];
      var p2 = waitingUsers[1];
      gameNumber += 1;
      var gameName = "Game-" + gameNumber.toString();
      var playersArray = [p1,p2];
      createGame(p1, p2);
      joinGame(p1, io, gameName);
      joinGame(p2, io, gameName);
    } else {
      socket.emit("notifySinglePlayer");
    };
    
    handlePlaceShips(socket, io);
    handleShot(socket, io);
    handleShotResponse(socket, io);
  });
};

module.exports = createGameServer;