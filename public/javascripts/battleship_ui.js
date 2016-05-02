var SPRITE_IMAGE_LENGTH = 64; 
var SPRITE_IMAGE_ROWS = 8;
var SPRITE_IMAGE_COLS = 8;
var MS_FRAME = 10;
var TOTAL_ANI_TIME = (SPRITE_IMAGE_ROWS * SPRITE_IMAGE_COLS) * MS_FRAME;

(function (root) {
  var App = root.App = (root.App || {});

  var BattleshipUI = App.BattleshipUI = function(options){
    
    this.$root = options.$root;
    this.socket = options.socket;
    this.missleUI = new BattleshipMissleUI();
    
  
    this.ourBoard = [];
    this.oppBoard = [];
    this.shipCounter = 0;
    this.takenPositions = {};
    this.ableToFire = false;
    this.hitShipSegments = [];
    
    this.createGrids();
    this.displayGrids();
    this.ships = this.createShips();
  };

  BattleshipUI.prototype = {
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
    registerHandlers: function(){
      var battleshipUI = this;
      
      this.socket.on('placeShips', function(payload) {
        $("#game-announcement").html("Place ships by clicking on tiles on 'My Board'.  Once you have finished placing ships, YOU MUST CLICK ON ONE MORE TILE ON YOUR BOARD to indicate completion of ship placement. ");
        $("#board1 .blueTile").on("click", battleshipUI.placeShips.bind(battleshipUI));
      });
      
      this.socket.on('notifySinglePlayer', function() {
        $("#game-announcement").html("This version of Battleship requires two players.  Currently, you are the only person here.  If you are an employer testing out Brent Vale's game, you can simulate the game experience by opening up a new window and acting as the second player.  You will have to place both sets of ships to begin the game.");
      });
      
      this.socket.on('goTime', function() {
        $("#game-announcement").html("Game has officially started");
      });
      
      this.socket.on('youSuck', function() {
        $("#game-announcement").html("You opponent has finished placing their ships! Hurry up already and place your ships!");
      });
      
      this.socket.on('firstPlayer', function() {
        $("#game-announcement").html("You finished placing ships first: once your partner catches up, you will drop first bomb.");
      });
      
      this.socket.on('yourTurn', function() {
        $("#game-announcement").html("Your Turn");
        battleshipUI.ableToFire = true;
        $("#board2 .tile").on("click", battleshipUI.handleShot.bind(battleshipUI));
      });
      
      this.socket.on('notYourTurn', function() {
        $("#game-announcement").html("Dude, that took you forever to place your ships! Your opponent gets to go first.  Next time place your ships faster and you'll get to go first.");
      });
      
      this.socket.on('SHOT', function(coords) {   
        var gameLost = false;     
        battleshipUI.ableToFire = true;
        var hit;
        var takenCoords = [coords.row, coords.col];
        if(battleshipUI.takenPositions[takenCoords]){
          //check if game has been lost
          battleshipUI.hitShipSegments.push(takenCoords);
          //for testing total ship segments is 2, in production will be 17
          if(battleshipUI.hitShipSegments.length === 17){
            gameLost = true;
          }
          hit = true;
          var hitSquare = $(battleshipUI.ourBoard[coords.row][coords.col].children()[0]);
          battleshipUI.missleUI.loopExplosion(coords, hitSquare)
        } else {
          hit = false;
          var unHitSquare = $(battleshipUI.ourBoard[coords.row][coords.col].children()[0]);
          $(unHitSquare).addClass("nohit");
        }
        
        battleshipUI.socket.emit("SHOT_RESPONSE", {hit: hit, row: coords.row, col: coords.col, gameLost: gameLost});
      })
      
      this.socket.on('makeNotTurn', function(params) {
        $("#board2 .blueTile").off("click");
        battleshipUI.ableToFire = false;
        
        if(params.hit){
          var hitSquare = $(battleshipUI.oppBoard[params.row][params.col].children()[0]);
          //
          var message = "HIT!!!!!" + '<br>' + "Waiting for opponent's shot";
          battleshipUI.missleUI.loopExplosion(params, hitSquare, message);
        } else {
          var unHitSquare = $(battleshipUI.oppBoard[params.row][params.col].children()[0]);
          $(unHitSquare).addClass("nohit");
          $("#game-announcement").html("swing and a miss..." + '<br>');
          $("#game-announcement").append("Waiting for opponent's shot");
        }
      })
      
      this.socket.on('GAME_OVER', function(object){
        var params = object[0];
        var gameOverResponse = object[1];
        var didWin = object[2];
        
        $("#board2 .blueTile").off("click");
        if(didWin){
          var hitSquare = battleshipUI.oppBoard[params.row][params.col];
          battleshipUI.missleUI.loopExplosion(params, hitSquare)
        } 
        battleshipUI.ableToFire = false;
        $("#game-announcement").html(gameOverResponse + '<br>');
        $("#game-announcement").append("click browser reload to start new game.");
      })
    },
    handleShot: function(e){
      if(this.ableToFire){
        e.preventDefault();
        this.ableToFire = false;
        var rowCord = parseInt(e.currentTarget.dataset.row);
        var colCord = parseInt(e.currentTarget.dataset.col);
        var coords = {row: rowCord, col: colCord};
      
        $("#board2 .blueTile").off("click");
        $("#game-announcement").html("FIRING...");
        var battleshipUI = this;
        battleshipUI.missleUI.launchMissle(function() {
          battleshipUI.socket.emit("HANDLE_SHOT_RESPONSE", coords);
        });
      }
    },
    createGrids: function(){
      for (var i = 0; i < 2; i++) {
        for (var j = 0; j < 10; j++) {
          // var rowNum = "<div class='gridEl'> " + j + "</div>"
          var row = [];
          for (var k = 0; k < 10; k++) {
            var div = document.createElement("div");
            var childDiv = document.createElement("div");
            var $div = $(div);
            var $childDiv = $(childDiv);
            
            $div.append($childDiv);
            $div.addClass("tile")
            $childDiv.addClass("blueTile");
            $div.attr('data-row', j);
            $div.attr('data-col', k);
            row.push($div);
          }
          if(i === 0){
            this.ourBoard.push(row);
          } else {
            this.oppBoard.push(row);
          }
        }
      }
    },
    displayGrids: function () {
      var $board1 = this.$root.find("#board1");
      var $board2 = this.$root.find("#board2");
      for(var i = 0; i < this.ourBoard.length; i++){
        for(var j = 0; j < this.ourBoard[i].length; j++){
          $board1.append(this.ourBoard[i][j]);
          $board2.append(this.oppBoard[i][j]);
        }
      }
      this.registerHandlers();
    },
    placeShips: function(event){
      var currentCoord = [$(event.currentTarget.parentElement).data("row"),
                          $(event.currentTarget.parentElement).data("col") ];
                          
      var currentShip = this.ships[this.shipCounter];
      currentShip.startCoord = currentCoord;

      var validCoords = this.possibleCoords(currentCoord, currentShip.length - 1);

      if(validCoords.length > 0){
        $(event.currentTarget).removeClass("blueTile").addClass("greenTile");
        $("#board1 .blueTile").off();
      }else{
        $("#board1 .blueTile").on("click", this.placeShips.bind(this));
      }
      
      for (var i = 0; i < validCoords.length; i++) {
        var $tempTile = $($(this.ourBoard[validCoords[i][0]][validCoords[i][1]]).children()[0]);
        $tempTile.removeClass("blueTile");
        $tempTile.off();
        $tempTile.addClass("redTile");
        $tempTile.on("click", this.placeNextShip.bind(this));
      }
    },
    placeNextShip: function(event){
      var placementCoord = [$(event.currentTarget.parentElement).data("row"),
                          $(event.currentTarget.parentElement).data("col") ];
      //remove red color from tiles, turn off listeners
      var placements = this.$root.find(".redTile");
      placements.removeClass("redTile");
      placements.addClass("blueTile");
      placements.off();
      
      //update coords once ship has been placed
      var targetShip = this.ships[this.shipCounter];
      targetShip.endCoord = placementCoord;
      targetShip.detectCoords();
      
      
      for(var i = 0; i < targetShip.segments.length; i ++) {
        var tempCoords = targetShip.segments[i];
        this.takenPositions[tempCoords] = true;
        
        var $tempTile = $($(this.ourBoard[tempCoords[0]][tempCoords[1]]).children()[0]);
        $tempTile.removeClass("blueTile");
        $tempTile.addClass("greenTile");
      }

      this.shipCounter += 1;
      if(this.shipCounter === 5){
        this.socket.emit("shipsPlaced");
        return;
      } else {
        $("#board1 .blueTile").on("click", this.placeShips.bind(this));
      }
    },
    possibleCoords: function(startCoords, length){
      var validCoords = [];
      var offsets = [];

      var rowOffPos = [startCoords[0] + length, startCoords[1]];
      var good = true;
      for (var i = startCoords[0] ; i <= (startCoords[0] + length); i++) {
        var tempRowOffPos = [i, startCoords[1]];
        if (this.takenPositions[tempRowOffPos]) {
          good = false;
        }
      }
      if(good){
        offsets.push(rowOffPos);
      }
      // offsets.push(rowOffPos);
      var rowOffNeg = [startCoords[0] - length, startCoords[1]];
      var good2 = true;
      for (var i = startCoords[0] - length ; i <= (startCoords[0]); i++) {
        var tempRowOffNeg = [i, startCoords[1]];
        if (this.takenPositions[tempRowOffNeg]) {
          good2 = false;
        }
      }
      if(good2){
        offsets.push(rowOffNeg);
      }

      var colOffPos = [startCoords[0], startCoords[1] + length];
      var good3 = true;
      for (var i = startCoords[1]; i <= (startCoords[1] + length); i++) {
        var tempColOffNeg = [startCoords[0], i];
        if (this.takenPositions[tempColOffNeg]) {
          good3 = false;
        }
      }
      if(good3){
        offsets.push(colOffPos);
      }

      var colOffNeg = [startCoords[0], startCoords[1] - length];
      var good4 = true;
      for (var i = startCoords[1] - length; i <= (startCoords[1]); i++) {
        var tempColOffNeg = [startCoords[0], i];
        if (this.takenPositions[tempColOffNeg]) {
          good4 = false;
        }
      }
      if(good4){
        offsets.push(colOffNeg);
      }

      for(var i = 0; i < offsets.length; i++){
        if(offsets[i][0] >= 0 && offsets[i][0] <= 9  &&
          offsets[i][1] >= 0 && offsets[i][1] <= 9 ){
          validCoords.push(offsets[i])
        }
      }
      return validCoords;

    },
    shoot: function(event){
      var oppCoord = [$(event.currentTarget).data("row"),
                          $(event.currentTarget).data("col") ];
      //if the coords lead to a hit, explode bomb
      //using same Interval as in 
      var that = this;
      window.setTimeout(function(){
        that.missleUI.loopExplosion(oppCoord)
      },TOTAL_ANI_TIME * 6); // multiple of animation count
      // alert("DESTROYED!: " + oppCoord);
    },
    autopopulate: function(){
      var ships = this.socket.shipsToPlace;
      for (var i = 0; i < 5; i++) {

        for (var j = 0; j < ships[i].length; j++) {
          ships[i].segments[j] = [i,j];
          $(this.ourBoard[i][j]).addClass("greenTile");
        }
      }
      $("#board1 .tile").off();
      $("#board2 .tile").on("click", this.shoot.bind(this));
    }
  };
}(this));
