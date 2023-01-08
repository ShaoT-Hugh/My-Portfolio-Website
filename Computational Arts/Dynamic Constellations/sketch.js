// require https://cdn.jsdelivr.net/npm/p5@latest/lib/p5.min.js

const _shapes = [];
const _shapeColor = "#ffffff";
const _shapeColors = ['#22577a', '#38a3a5', '#57cc99', '#80ed99', '#c7f9cc'];

const _maxSize = 240, _minSize = 120;
const _ptSize = 24, _scale = 0.001;
const _maxSpd = 0.9, _minSpd = 0.2;

function setup() {
  createCanvas(640, 480);
}

function draw() {
  background(0);
  
  // generate shapes
  if(frameCount % 10 === 0 && random(100) < 10) {
    createShape(0 - _maxSize, random(height), random(_minSize, _maxSize), random(_minSize, _maxSize), random(_minSpd, _maxSpd));
  }
  // update shapes
  if(_shapes.length > 0) {
    for(let s in _shapes) {
      _shapes[s].update();
      _shapes[s].show();
      if(_shapes[s].ifLeave()) _shapes.splice(s, 1);
    }
  }
}

function createShape(x, y, w, h, spd) {
  _shapes.push(new quad(x, y, w, h, spd));
}

class quad {
  constructor(x, y, w, h, spd) {
    this.pos_x = x;
    this.pos_y = y;
    this.width = w;
    this.height = h;
    this.scale = map((w + h) / 2 / spd, _minSize / _maxSpd, _maxSize / _minSpd, 0.4, 1);
    // Initialize 4 vertexes
    this.vtxX = [];
    this.vtxY = [];
    this.ovtxX = [];
    this.ovtxY = [];
    this.length = floor(random(3, 6));
    for(let v = 0; v < this.length; v++) {
      this.ovtxX.push(random(0-w/2, w/2));
      this.ovtxY.push(random(0-h/2, h/2));
      this.vtxX.push(this.ovtxX[v] + this.pos_x);
      this.vtxY.push(this.ovtxY[v] + this.pos_y);
    }
    
    this.spd = spd;
    
    // Initialize the color
    let col = _shapeColors[floor(random(_shapeColors.length))];
    this.color = lerpColor(color(0), color(col), map(spd, _minSpd, _maxSpd, 0.25, 0.75));
    this.colorline = color(col);
    this.colorline.setAlpha(map(spd, _minSpd, _maxSpd, 40, 120));
  }
  
  // check if the shape leave the canvas
  ifLeave() {
    let x = this.pos_x, y = this.pos_y, w = this.width, h = this.height;
    if(x - w > width) return true;
    else return false;
  }
  
  update() {
    let w = this.width, h = this.height, spd = this.spd;
    this.pos_x += spd;
    for(let v = 0; v < this.length; v++) {
      this.vtxX.splice(v, 1, this.ovtxX[v] + map(noise(frameCount * spd * _scale, v), 0, 1, 0 - w, w) + this.pos_x);
      this.vtxY.splice(v, 1, this.ovtxY[v] + map(noise(v, frameCount * spd * _scale), 0, 1, 0 - h, h) + this.pos_y);
    }
  }
  show() {
    push();
    noFill();
    stroke(this.colorline);
    strokeWeight(this.scale * 2);
    beginShape();
    for(let v = 0; v < this.length; v++) {
      vertex(this.vtxX[v], this.vtxY[v]);
    }
    endShape();
    noStroke();
    fill(this.color);
    for(let v = 0; v < this.length; v++) {
      circle(this.vtxX[v], this.vtxY[v], this.scale * _ptSize);
    }
    pop();
  }
}