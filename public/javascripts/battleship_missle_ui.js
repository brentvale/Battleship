function BattleshipMissleUI(){
  
}

BattleshipMissleUI.prototype = {
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
  launchMissle: function(callback){
    //getBoundingClientRect() => returns an elements absolute position on page
    //get coordinates of bombedTile
    // var bombSpot = event.currentTarget.getBoundingClientRect();
    //launchedMissle start coords are top: 445px; left: 10px; 
    var launchedMissle = $(".traveling-missle");
    var bombY = 300
    var bombX = 800
  
  
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
      launchedMissle.css({"top": 300, "left": 10});
      callback();
    },TOTAL_ANI_TIME * 3); // multiple of animation count
  },
  
  loopExplosion: function(params, hitSquare, message){
    var displayMessage = message || "dontDisplay";
    //params => {hit: true, row: row, col: col}
    var $hitSquare = $(hitSquare);
    $hitSquare.addClass("explosion");
    
    var rowCount = 0;
    var colCount = 0;
    
    var explosionInterval = window.setInterval(function(){
      //30 is the width of each image in the 120x120 16 grid sprite
      var position = (colCount*33*-1) + "% " + (rowCount*33*-1) + "%";
      $hitSquare.css("background-position", position);
      colCount += 1;
      if(colCount >= 4){ //manual setting of col width: bomb image is 4 x 4
        rowCount += 1;
        colCount = 0;
      }
    }, 50);
    
    //time for clear interval is 16 times the above interval
    var that = this;
    window.setTimeout(function(){
      clearInterval(explosionInterval);
      if(!(displayMessage === "dontDisplay")){
        $("#game-announcement").html(displayMessage);
      } 
      $hitSquare.addClass("hit");
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
}

