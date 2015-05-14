var socketio = require('socket.io');

var createGameServer = function (server) {
  var io = socketio.listen(server);

  io.sockets.on('connection', function (socket) {
    
  });


};

module.exports = createGameServer;