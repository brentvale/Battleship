var SPRITE_IMAGE_LENGTH = 64; 
var SPRITE_IMAGE_ROWS = 8;
var SPRITE_IMAGE_COLS = 8;
var MS_FRAME = 10;
var TOTAL_ANI_TIME = (SPRITE_IMAGE_ROWS * SPRITE_IMAGE_COLS) * MS_FRAME;

function BattleshipUI($root, battleship){
  this.root = $root;
  this.battleship = battleship;
  this.ourBoard = [];
  this.oppBoard = [];
  this.createGrids();
  this.displayGrids();
  this.gameStates = new GameStates();
  $("#board1 .blueTile").on("click", this.placeShips.bind(this));
  this.shipCounter = 0;
  this.takenPositions = {};
  $("#pop").on("click", this.autopopulate.bind(this));
  $("#practice-launch-missle").on("click", this.practiceLaunchMissle.bind(this));
  $("#board2 .tile").on("click", this.launchMissle.bind(this));
  $("#practice-explode-bomb").on("click", this.practiceExplosion.bind(this));
}

BattleshipUI.prototype = {
  practiceLaunchMissle: function(){
    var rowCount = 0;
    var colCount = 0;

    var animationInterval = window.setInterval(function() {
      var position = (colCount*64*-1) + "px " + (rowCount*64*-1) + "px";
      $(".missle").css("background-position", position);
      console.log(position);
      colCount += 1;
      if(colCount >= SPRITE_IMAGE_COLS){
        rowCount += 1;
        colCount = 0;
      }
    }, MS_FRAME*3);
    window.setTimeout(function() {
      clearInterval(animationInterval);
    },TOTAL_ANI_TIME*3);
  },
  launchMissle: function(event){
    //getBoundingClientRect() => returns an elements absolute position on page
    //get coordinates of bombedTile
    var bombSpot = event.currentTarget.getBoundingClientRect();
    //launchedMissle start coords are top: 445px; left: 10px; 
    var launchedMissle = $(".traveling-missle");
    var bombY = Math.floor(bombSpot.top) + 20;
    var bombX = Math.floor(bombSpot.left) + 55;
    
    
    //delta Y = 445 - bombY divided by total num of frames SPRITE_IMAGE_LENGTH
    // var delY = (bombY - 430)/SPRITE_IMAGE_LENGTH;
    var delY = 0;
    //delta X = bombX - 10px divided by total num of frames SPRITE_IMAGE_LENGTH
    // var delX = (bombX - 10)/SPRITE_IMAGE_LENGTH;
    var delX = 3;
    
    var rowCount = 0;
    var colCount = 0;
    var aniCount = 0;
    var animationInterval = window.setInterval(function() {
      aniCount += 1;
      if(aniCount % 6 === 0){
        var position = (colCount*SPRITE_IMAGE_LENGTH*-1) + "px " + (rowCount*SPRITE_IMAGE_LENGTH*-1) + "px";
        launchedMissle.css("background-position", position);
        colCount += 1;
        if(colCount >= SPRITE_IMAGE_COLS){
          rowCount += 1;
          colCount = 0;
        }
        console.log(position);
      }
      
      var currentTop = launchedMissle.css("top");
      var currentLeft = launchedMissle.css("left");
      var newTop = parseInt(currentTop.slice(0,-2)) + (delY);
      var newLeft = parseInt(currentLeft.slice(0,-2)) + (delX);
      launchedMissle.css({"top": newTop, "left": newLeft});
      
    }, MS_FRAME);
    var that = this;
    window.setTimeout(function() {
      clearInterval(animationInterval);
      launchedMissle.css({"top": 430, "left": 10});
    },TOTAL_ANI_TIME * 6); // multiple of animation count
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
  },
  placeShips: function(event){
    $("#board1 .tile").off();
    if(this.shipCounter > 4){
      this.gameStates.PLACE_SHIPS = false;
      this.gameStates.SHOOT = true;
      $("#board2 .tile").on("click", this.shoot.bind(this));
      return;
    }
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
    var that = this;

    $("#board1 .blueTile").on("click", that.placeShips.bind(that));


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
      that.loopExplosion(oppCoord)
    },TOTAL_ANI_TIME * 6); // multiple of animation count
    // alert("DESTROYED!: " + oppCoord);
  },
  loopExplosion: function(coords){
    
    var divToExplode = this.oppBoard[coords[0]][coords[1]];
    $(divToExplode).addClass("explosion");
    var rowCount = 0;
    var colCount = 0;
    
    var explosionInterval = window.setInterval(function(){
      //30 is the width of each image in the 120x120 16 grid sprite
      var position = (colCount*30*-1) + "px " + (rowCount*30*-1) + "px";
      $(divToExplode).css("background-position", position);
      colCount += 1;
      if(colCount >= 4){ //manual setting of col width: bomb image is 4 x 4
        rowCount += 1;
        colCount = 0;
      }
    }, 50);
    
    //time for clear interval is 16 times the above interval
    window.setTimeout(function(){
      clearInterval(explosionInterval)
    }, 800);
  },
  practiceExplosion: function(event){
    var divToExplode = $(".practice-bomb");
    var rowCount = 0;
    var colCount = 0;
    
    var explosionInterval = window.setInterval(function(){
      
      var position = (colCount*64*-1) + "px " + (rowCount*64*-1) + "px";
      $(divToExplode).css("background-position", position);
      colCount += 1;
      if(colCount >= 4){ //manual setting of col width: bomb image is 4 x 4
        rowCount += 1;
        colCount = 0;
      }
    }, 50);
    
    //time for clear interval is 16 times the above interval
    window.setTimeout(function(){clearInterval(explosionInterval)}, 800);
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
}
