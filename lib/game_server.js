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
  //remove both users from waitingUsers array
  waitingUsers = waitingUsers.slice(2);
  var nameOfGame = "Game-" + gameNumber.toString();
  var Game = {
    gameName: nameOfGame,
    waitingForShips: [p1.id, p2.id],
    readyPlayers: []
  };
  games.push(Game);
}

//in waitingForShips until player signals completion of ship placement

var joinGame = function (socket, io, gameName) {
  socket.join(gameName);
  //all sockets can be looked up by id (key) and their value will be (room)
  currentGame[socket.id] = gameName;
  // console.log("games.indexOf(room) = ");
 //  console.log("gameName :" + gameName);
  // for(var i = 0; i < games.length; i ++){
//     console.log(games[i].gameName);
//   }
  io.to(gameName).emit('placeShips', {
    text: "joined" + gameName
  })
};

var handlePlaceShips = function (socket, io){
  socket.on("shipsPlaced", function() {
    // console.log("currentGame[socket.id] = " + currentGame[socket.id]);
    var targetGame = getTargetGame(socket.id);
    console.log("target game is : " + targetGame.gameName);
    // console.log("length " + targetGame.waitingForShips.length);
    var socketIndex = targetGame.waitingForShips.indexOf(socket.id);
    //
    switch(socketIndex){
    case 0:
      targetGame.waitingForShips.shift();
      break;
    case 1:
      targetGame.waitingForShips.pop();
      break;
    }
    
 
    targetGame.readyPlayers.push(socket);
    //otherSocket will either be socket left in waitingForShips or first socket of readyPlayers 
    //both players have already been pushed in to readyPlayers
    var otherSocket;
    var otherSocketId;
    if(targetGame.waitingForShips.length === 1){
      
      otherSocketId =  targetGame.waitingForShips[0];
      otherSocket = allUsers[otherSocketId];
      console.log("otherSocket = " + otherSocket);
      otherSocket.emit("youSuck");
      socket.emit("firstPlayer");
    } 
    if(targetGame.readyPlayers.length === 2){
      otherSocket =  targetGame.readyPlayers[0];
      // io.to(currentGame[socket.id]).emit("goTime");
      otherSocket.emit("yourTurn");
      socket.emit("notYourTurn");
    }
    // console.log("length " + targetGame.waitingForShips.length);
 //    io.to(currentGame[socket.id]).emit("testing");
    //emit back to the user that placed ship that their turn is first, and they are waiting for the other user to finish placing their ships
    //emit bcak to the user still placing ships that they need to hurry up

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
  console.log(targetGame.gameName);
  console.log(targetGame.readyPlayers.length);
  
  console.log("currentSocketIndex = " + currentSocketIndex + " (should be 0 or 1)");
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
      console.log("socketId is " + socketId);
      console.log("games is : " + games);
      console.log("games.length is : " + games.length);
    
      targetGame = games[i];
    }
  }
  console.log("double check targetGame before return : " + targetGame.gameName);
  return targetGame;
};

var handleShot = function(socket, io){
  socket.on("SHOT", function(coords) {
    console.log("socket is : " + socket);
    console.log("socket.id is : " + socket.id);
    console.log("io is : " + io);
    
    var targetGame = getTargetGame(socket.id);
    var otherPlayer = getOtherPlayer(targetGame, socket.id);
    console.log("COORDS ARE : " +  coords.row + " : " + coords.col);
    console.log("otherPlayer is : " + otherPlayer);
    console.log("currentPlayer is : " + socket);
    otherPlayer.emit("SHOT", coords);
  });
};
var handleShotResponse = function(socket, io){
  socket.on("SHOT_RESPONSE", function(params) {
    console.log("PARAMS ARE " + params);
    socket.emit("yourTurn");
    var targetGame = getTargetGame(socket.id);
    var otherPlayer = getOtherPlayer(targetGame, socket.id);
    otherPlayer.emit("makeNotTurn", params);
  })
};

var createGameServer = function (server) {
  var io = socketio.listen(server);

  io.sockets.on('connection', function (socket) {
    nicknames[socket.id] = nextGuestName();
    allUsers[socket.id] = socket;
    waitingUsers.push(socket);
    // console.log("waitingUsers is : " + waitingUsers);
//     console.log("socket is : " + socket);
    
    if(waitingUsers.length > 1){
      var p1 = waitingUsers[0];
      var p2 = waitingUsers[1];
      // console.log("p1 is :" + p1);
      // console.log("p2 is :" + p2);
      gameNumber += 1;
      var gameName = "Game-" + gameNumber.toString();
      var playersArray = [p1,p2];
      createGame(p1, p2);
      //need both players to join a room
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