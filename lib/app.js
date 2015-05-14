var http = require('http'),
  static = require('node-static');

var file = new static.Server('./public');

var server = http.createServer(function (req, res) {
  console.log("inside create server");
  req.addListener('end', function () {
    console.log("end callback");
    file.serve(req, res);
    console.log("serve called")
  }).resume();
  console.log("end of create server")
});


server.listen(8000);
console.log("server started");

var createGameServer = require('./game_server.js');
createGameServer(server);
