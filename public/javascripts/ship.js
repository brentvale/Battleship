function Ship(options){
  this.length = options.length
  this.segments = [];
  this.startCoord;
  this.endCoord;
}

Ship.prototype = {
  detectCoords: function(){
    var direction;
    var startY;
    var endRow;
    //if they are on the same row
    if (this.startCoord[0] === this.endCoord[0]) {
      if (this.startCoord[1] < this.endCoord[1]) {
        startY = this.startCoord[1];
        endY = this.endCoord[1];
      }else{
        endY = this.startCoord[1];
        startY = this.endCoord[1];
      }
      for (var i = startY; i <= endY; i++) {
        this.segments.push([this.startCoord[0], i])
      }
    }
    //if they are all in the same col
    if (this.startCoord[1] === this.endCoord[1]) {
      if (this.startCoord[0] < this.endCoord[0]) {
        startY = this.startCoord[0];
        endY = this.endCoord[0];
      }else{
        endY = this.startCoord[0];
        startY = this.endCoord[0];
      }
      for (var i = startY; i <= endY; i++) {
        this.segments.push([i, this.startCoord[1]]);
      }
    }

  }
}
