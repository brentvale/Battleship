var http = require('http'),
  static = require('node-static');

var file = new static.Server('./public');

var server = http.createServer(function (req, res) {
  req.addListener('end', function () {
    file.serve(req, res);
  }).resume();
});

var port = process.env.PORT || 8000;
server.listen(port);

var createGameServer = require('./game_server.js');
createGameServer(server);
