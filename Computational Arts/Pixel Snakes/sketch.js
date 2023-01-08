// require https://cdn.jsdelivr.net/npm/p5@1.4.0/lib/p5.js

var img; // canvas to be presented

const snakes = []; // current snakes on the canvas
const snakeLength = 10;
const defaultAmount = 30;

var colors = []; // default colors
var snakeAmount = defaultAmount;

function setup() {
  frameRate(15);
  createCanvas(480, 480);
  noSmooth();
  colors = [color('#0d3b66'), color('#faf0ca'), color('#f4d35e'), color('#ee964b'), color('#f95738')];
  
  img = createImage(50, 50);
  setupImg(img, defaultAmount);
  // noLoop();
}

function draw() {
  background(0);
  
  updateImg(img);
  image(img, 0, 0, width, height);
}

// select random start points
function setupImg(img, num) {
  let w = img.width, h = img.height;
  img.loadPixels();
  for(let i = 0; i < num; i++) {
    createSnake(img, w, h);
  }
  img.updatePixels();
}
// create a new snake
function createSnake(img, w, h) {
  let index = floor(random(w * h)) * 4;
  let col = colors[floor(random(colors.length))];
    
  img.pixels[index] = red(col);
  img.pixels[index + 1] = green(col);
  img.pixels[index + 2] = blue(col);
  img.pixels[index + 3] = alpha(col);
}

// update the image
function updateImg(img) {
  let w = img.width, h = img.height, nextPixels = [];
  img.loadPixels();
  for(let i = 0; i < 4 * w * h; i += 4) {
    if(img.pixels[i] + img.pixels[i + 1] + img.pixels[i + 2] < 765) {
      if(img.pixels[i + 3] === 255) {
        img.pixels[i + 3] -= 255 / snakeLength; // reduce alpha
        let r = img.pixels[i];
        let g = img.pixels[i + 1];
        let b = img.pixels[i + 2];
      
        // select the next pixel
        nextPixels.push(randomAroundPixel(img, i));
        nextPixels.push(r);
        nextPixels.push(g);
        nextPixels.push(b);
      } else if(img.pixels[i + 3] > 0) {
        img.pixels[i + 3] -= 255 / snakeLength; // reduce alpha
      } else {
        img.pixels[i] = 0;
        img.pixels[i + 1] = 0;
        img.pixels[i + 2] = 0;
        img.pixels[i + 3] = 0; // reset alpha
      }
    }
  }
  // update all the new pixels
  snakeAmount = nextPixels.length / 4;
  for(let p = 0; p < nextPixels.length; p += 4) {
    img.pixels[nextPixels[p]] = nextPixels[p + 1];
    img.pixels[nextPixels[p] + 1] = nextPixels[p + 2];
    img.pixels[nextPixels[p] + 2] = nextPixels[p + 3];
    img.pixels[nextPixels[p] + 3] = 255;  
  }
  // complement snakes
  if(snakeAmount < defaultAmount) {
    createSnake(img, w, h);
  }
  img.updatePixels();
}

// select a random pixel around a specific pixel
function randomAroundPixel(img, i) {
  let randomAround = checkPixel(img, shuffle(selectAroundPixel(img, i)));
  
  if(randomAround.length > 0) return randomAround[0];
  else {
    return floor(random(img.width * img.height)) * 4;
  }
}
// select the 4 pixels around a specific pixel
// (must call loadPixels() before used)
function selectAround(img, i) {
  let w = img.width, h = img.height, around = [];
  
  if(i / 4 < w) around.push(null); // check top
  else around.push(img.pixel[i - w * 4]);
  if(i / 4 % w === 0) around.push(null); // check left
  else around.push(img.pixels[i - 4]);
  if(i / 4 % w === w - 1) around.push(null); // check right
  else around.push(img.pixels[i + 4]);
  if(i / 4 > w * h - 1 - w) around.push(null); // check bottom
  else around.push(img.pixels[i + w * 4]);
  // order: TOP, LEFT, RIGHT, BOTTOM
  return around;
}
function selectAroundPixel(img, i) {
  let w = img.width, h = img.height, around = [];
  if(i / 4 >= w) // check top
    around.push(i - w * 4);
  if(i / 4 % w !== 0) // check left
    around.push(i - 4);
  if(i / 4 % w !== w - 1) // check right
    around.push(i + 4);
  if(i / 4 <= w * h - 1 - w) // check bottom
    around.push(i + w * 4);
  // order: TOP, LEFT, RIGHT, BOTTOM
  return around;
}
// check selected pixels; delete all the pixels whose alpha > 0
function checkPixel(img, index) {
  let newIndex = index;
  for(let p in newIndex) {
    if(img.pixels[index[p] + 3] > 0) newIndex.splice(p, 1);
  }
  return newIndex;
}