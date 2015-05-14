(function (root) {
  var App = root.App = (root.App || {});
  var Battleship = App.Battleship = function(socket){
    this.socket = socket;
    this.shipsToPlace = this.createShips();
    this.registerHandlers();
  }

  Battleship.prototype = {
    createShips: function(){
      var ships = [];
      var shipOne = new Ship({length:2});
      ships.push(shipOne);
      var shipTwo = new Ship({length:3});
      ships.push(shipTwo);

      var shipThree = new Ship({length:3});
      ships.push(shipThree);

      var shipFour = new Ship({length:4});
      ships.push(shipFour);

      var shipFive = new Ship({length:5});
      ships.push(shipFive);
      return ships;
    },
    registerHandlers: function() {
      var 
    }
    
  }
  
}(this));
