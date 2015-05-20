var SPRITE_IMAGE_LENGTH = 64; 
var SPRITE_IMAGE_ROWS = 8;
var SPRITE_IMAGE_COLS = 8;
var MS_FRAME = 10;
var TOTAL_ANI_TIME = (SPRITE_IMAGE_ROWS * SPRITE_IMAGE_COLS) * MS_FRAME;

(function (root) {
  var App = root.App = (root.App || {});

  var BattleshipUI = App.BattleshipUI = function($root, battleship){
    
    this.root = $root;
    this.battleship = battleship;
  
    this.ourBoard = [];
    this.oppBoard = [];
    this.shipCounter = 0;
    this.takenPositions = {};
    this.ableToFire = false;
  
    // this.gameState = new GameStates();
    this.missleUI = new BattleshipMissleUI();
  
    // $("#pop").on("click", this.autopopulate.bind(this));
//     $("#practice-launch-missle").on("click", this.missleUI.practiceLaunchMissle.bind(this));
//
//     $("#practice-explode-bomb").on("click", this.missleUI.practiceExplosion.bind(this));
  
    this.createGrids();
    this.displayGrids();
    this.registerHandlers();
  };

  BattleshipUI.prototype = {
    registerHandlers: function(){
      //var that = this;
      var battleshipUI = this;
      
      this.battleship.socket.on('placeShips', function(payload) {
        $("#game-announcement").html("place ships");
        $("#board1 .blueTile").on("click", battleshipUI.placeShips.bind(battleshipUI));
      });
      
      this.battleship.socket.on('notifySinglePlayer', function() {
        $("#game-announcement").html("only player here...waiting for next");
      })
      
      this.battleship.socket.on('goTime', function() {
        $("#game-announcement").html("Game has officially started");
      })
      
      this.battleship.socket.on('youSuck', function() {
        $("#game-announcement").html("hurry up already and place your ships!");
      })
      
      this.battleship.socket.on('firstPlayer', function() {
        $("#game-announcement").html("You finished placing ships first: once your idiot partner catches up, you will drop first bomb");
      })
      
      this.battleship.socket.on('yourTurn', function() {
        $("#game-announcement").html("Your Turn");
        battleshipUI.ableToFire = true;
        $("#board2 .tile").on("click", battleshipUI.handleShot.bind(battleshipUI));
        // battleshipUI.battleship.handleTurnToggle.bind(battleshipUI);
      })
      
      this.battleship.socket.on('notYourTurn', function() {
        $("#game-announcement").html("sorry dum dum, took you too long to place your ships, your opponent gets to go first.");
      })
      
      this.battleship.socket.on('SHOT', function(coords) {
        battleshipUI.ableToFire = true;
        var hit;
        var takenCoords = [coords.row, coords.col];
        if(battleshipUI.takenPositions[takenCoords]){
          hit = true;
          var hitSquare = battleshipUI.ourBoard[coords.row][coords.col];
          battleshipUI.missleUI.loopExplosion(coords, hitSquare)
          // $(hitSquare).addClass("hit");
        } else {
          hit = false;
          var unHitSquare = battleshipUI.ourBoard[coords.row][coords.col];
          $(unHitSquare).addClass("nohit");
        }
        
        battleshipUI.battleship.socket.emit("SHOT_RESPONSE", {hit: hit, row: coords.row, col: coords.col});
      })
      
      this.battleship.socket.on('makeNotTurn', function(params) {
        $("#board2 .blueTile").off("click");
        if(params.hit){
          var hitSquare = battleshipUI.oppBoard[params.row][params.col];
          var message = "HIT!!!!!" + '<br>' + "Waiting for opponent's shot";
          battleshipUI.missleUI.loopExplosion(params, hitSquare, message)
        } else {
          var unHitSquare = battleshipUI.oppBoard[params.row][params.col];
          $(unHitSquare).addClass("nohit");
          $("#game-announcement").html("swing and a miss..." + '<br>');
          $("#game-announcement").append("Waiting for opponent's shot");
        }
        battleshipUI.ableToFire = false;
      })
      
    },
    handleShot: function(e){
      e.preventDefault();
      var rowCord = parseInt(e.currentTarget.dataset.row);
      var colCord = parseInt(e.currentTarget.dataset.col);
      var coords = {row: rowCord, col: colCord};
      this.battleship.socket.emit("SHOT", coords);
      // var shotCoords =
    },
    createGrids: function(){
      for (var i = 0; i < 2; i++) {
        for (var j = 0; j < 10; j++) {
          // var rowNum = "<div class='gridEl'> " + j + "</div>"
          var row = [];
          for (var k = 0; k < 10; k++) {
            var div = document.createElement("div");
            $(div).addClass("tile").addClass("blueTile");
            $(div).attr('data-row', j);
            $(div).attr('data-col', k);
            row.push(div);
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
      for(var i = 0; i < this.ourBoard.length; i++){
        for(var j = 0; j < this.ourBoard[i].length; j++){
          $(this.root).find("#board1").append(this.ourBoard[i][j]);
          $(this.root).find("#board2").append(this.oppBoard[i][j]);
        }
      }
      $("#board2 .blueTile").on("click", this.placeShips.bind(this));
    },
    placeShips: function(event){
      $("#board1 .tile").off();
      if(this.shipCounter === 1){
        this.battleship.socket.emit("shipsPlaced");
        return;
      }
      // if(this.shipCounter > 4){
//         $("#board2 .tile").on("click", this.shoot.bind(this));
//         return;
//       }
      var currentCoord = [$(event.currentTarget).data("row"),
                          $(event.currentTarget).data("col") ];

      var currentShip = this.battleship.shipsToPlace[this.shipCounter];
      currentShip.startCoord = currentCoord;
      var validCoords = this.possibleCoords(currentCoord, currentShip.length - 1);
      if(validCoords.length > 0){
        $(event.currentTarget).removeClass("blueTile");
        $(event.currentTarget).addClass("greenTile");
      }else{
        $("#board1 .blueTile").on("click", this.placeShips.bind(this));
      }
      for (var i = 0; i < validCoords.length; i++) {
        var tempTile = this.ourBoard[validCoords[i][0]][validCoords[i][1]];
        $(tempTile).removeClass("blueTile");
        $(tempTile).off();
        $(tempTile).addClass("redTile");
        $(tempTile).on("click", this.placeNextShip.bind(this));
      }
    },
    placeNextShip: function(event){
      var placementCoord = [$(event.currentTarget).data("row"),
                          $(event.currentTarget).data("col") ];
      var placements = $(this.root).find(".redTile");
      var targetShip = this.battleship.shipsToPlace[this.shipCounter];
      targetShip.endCoord = placementCoord;
      targetShip.detectCoords();
      this.shipCounter += 1;
      placements.removeClass("redTile");
      placements.addClass("blueTile");
      placements.off();
      for(var i = 0; i < targetShip.segments.length; i ++) {
        var tempCoords = targetShip.segments[i];
        var tempTile = this.ourBoard[tempCoords[0]][tempCoords[1]];
        this.takenPositions[tempCoords] = true;
        $(tempTile).removeClass("blueTile");
        $(tempTile).addClass("greenTile");
      }

      $("#board1 .blueTile").on("click", this.placeShips.bind(this));

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
      var ships = this.battleship.shipsToPlace;
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
