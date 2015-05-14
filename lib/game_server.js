var socketio = require('socket.io');

var waitingUsers = [];
var gameNumber = 0;
var nicknames = {};

var nextGuestName = (function () {
  var guestNumber = 1;
  return function () {
    guestNumber += 1;
    return "Guest" + guestNumber;
  };
}());

var Game = function(player1, player2){
  gameName: gameNumber.toString(),
  waitingForShips: [player1, player2]
};

var joinRoom = function (socket, io, room) {
  socket.join(room);
  currentRoom[socket.id] = room;

  io.to(room).emit('message', {
    nickname: nicknames[socket.id],
    text: "joined " + room,
    room: room
  });
};

var createGameServer = function (server) {
  var io = socketio.listen(server);

  io.sockets.on('connection', function (socket) {
    nicknames[socket.id] = nextGuestName();
    waitingUsers.push(socket);
    if(waitingUsers.length > 1){
      var p1 = waitingUsers[0];
      var p2 = waitingUsers[1];
      gameNumber += 1;
      var game = new Game(p1,p2);
      joinRoom(socket, io, gameNumber.toString());
    }
  });
};

module.exports = createGameServer;