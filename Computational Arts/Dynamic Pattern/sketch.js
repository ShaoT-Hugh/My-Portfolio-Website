var tim = 0; // time(sec)
var fraRate = 30;
var a; // sqrt(3) / 2

var wid = 90; // width of each single wave sector
var gap = 25; // gap between each ring in wave sector
var row; // number of rows of waves
var col; // number of columns of waves

var waveFreq = 2; // frequecny of wave(r/sec)
var waveExt = 6; // extent of wave

// uploaded images
var img_fish;
var img_boat;

var boat; // the boat
var fishStay = 1.5; // present time of fishes(sec)
var fishes = []; // all fishes on the canvas
let beats = []; // all the beats on the canvas
let beatScale = 80; // intial diameter of beat circle

function preload(){
  img_fish = loadImage('Fishes.png');
  img_boat = loadImage('Boat.png');
}
function setup() {
  createCanvas(600, 600);
  angleMode(DEGREES);
  rectMode(CENTER);
  frameRate(fraRate);
  
  a = sqrt(3) / 2;
  row = ceil((height + a * wid / 2) / a / wid * 4) + 1;
  col = ceil((width + wid / 2) / wid) + 1;
  
  let rdmRow = floor(random(2, row));
  boat = new boats(rdmRow);
}

function draw() {
  background(100);
  tim = millis() / 1000;
  
  let offX = offsetX(tim, wid);
  let offY = offsetY(tim, waveFreq, waveExt);
  // update patterns
  patterns(wid, gap, offX, offY);
  

  // update beats
  if(beats.length > 0){
    for(let i = 0; i < beats.length; i++){
      beats[i].show();
      if(beats[i].count <= 0) beats.splice(i, 1);
    } 
  }
}

function mousePressed(){
  let x = mouseX;
  let y = mouseY;
  
  createBeat(x, y);
  
  createFish(x, y);
}

// draw patterns
function patterns(di, ga, offX, offY){
  let r = di / 2;
  
  stroke(128, 223, 255);
  fill(250);
  for(let i = 0; i < row; i++){
    let isEven = i % 2 === 0 ? true : false;
    let dy = isEven ? offY : 0-offY;
    for(let j = 0; j < col; j++){
      concenter(
        i % 2 * r + (j - 1) * di + offX, 
        i * a * r / 2 + dy, 
        di, ga);
    }
    checkFish(i); // check if to show the fish
    boat.checkBoat(i, offX, offY);
  }
}
// draw a single wave sector
function concenter(x, y, d, g){
  for(let i = 0; i < 3; i++){
    if(i === 0) strokeWeight(2.8);
    else strokeWeight(1.5);
    arc(x, y, d - i * g, d * a - i * g, 150, 390, OPEN);
  }
}
// offset of waves
function offsetX(t){
  return map(pow(t % 2 - 1, 3) + 1, 0, 2, 0, wid);
} // horizontal movement of waves
function offsetY(t, freq, ext){
  return sin(t * 360 / freq) * ext;
} // vertical movement of waves

class boats{
  constructor(row){
    this.row = row;
    this.sy = row * wid * a / 4;
    this.sx = -100;
    this.lt = 0;
  }
  
  show(t, offX, offY){
    let x = this.sx + (floor(t / 2) % col) * wid + offX - 100;
    let y = this.sy + offY - 115;
    image(img_boat, x, y, 180, 120);
    
    // check if the boat reach the right boundary
    if(floor(t / 2) % col < floor(this.lt / 2) % col){
      this.row = floor(random(2, row));
      this.sy = this.row * wid * a / 4;
    }
    this.lt = t;
  }
  // check when to show the boat
  checkBoat(i, offX, offY){
    if(this.row === i){
      this.show(tim, offX, offY);
    }
  }
}

class fish{
  constructor(x, y, r){
    this.beg_x = x;
    this.beg_y = y;
    this.count = fishStay * fraRate;
    this.row = r; // on which row the fish should be drawn
  }
  
  show(){ // show the fish
    let c = this.count;
    let offsetX = map(c, fishStay * fraRate, 0, 0, 50);
    let offsetY = sin(map(c, fishStay * fraRate, 0, 0, 180)) * 60;
    let x = this.beg_x + offsetX - 30;
    let y = this.beg_y - offsetY - 30;
    image(img_fish, x, y, 60, 60);
    this.count--;
  }
}
// create a new fish
function createFish(x, y){
  let row = floor(y / wid / a * 4);
  fishes.push(new fish(x, y, row));
}
// check when to show the fish
function checkFish(i){
  if(fishes.length > 0){
    for(let k = 0; k < fishes.length; k++){
      if(fishes[k].row === i){
        fishes[k].show();
        if(fishes[k].count <= 0) fishes.splice(k, 1); 
  }}}
}

class beat{
  constructor(x, y){
    this.x = x;
    this.y = y;
    this.count = 20; // timer of the beat life cycle
  }
  
  show(){ // show the beat
    let p = this.count / 20;
    noStroke();
    fill(250, max(0, p * 50));
    circle(this.x, this.y, map(p, 0, 1, 3, 1) * beatScale);
    this.count--;
  }
}
// create a new beat
function createBeat(x, y){
  beats.push(new beat(x, y));
}