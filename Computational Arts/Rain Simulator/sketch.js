// require https://cdn.jsdelivr.net/npm/p5@latest/lib/p5.min.js
// require https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.4.0/addons/p5.sound.min.js

var slider_spd, slider_dens, slider_direct;
var rain_sound;
var load_over = false;

var speed = 0.5;
var density = 5;
var direction = 10;

function preload() {
  soundFormats('ogg');
  // rain_sound = createAudio("rain_normal.ogg", function(){
  //   load_over = true;
  // });
  rain_sound = createAudio("https://raw.githubusercontent.com/ShaoT-Hugh/Computational-Form/main/rain_normal.ogg", function(){
    load_over = true;
  });
}

function setup() {
  createCanvas(600, 600);
  strokeWeight(0.1);
  noFill();
  angleMode(DEGREES);
  textSize(16);
  
  // set up the sliders
  slider_spd = createSlider(0.1, 2, 1, 0.1);
  slider_spd.position(40, 50);
  slider_dens = createSlider(5, 20, 10);
  slider_dens.position(240, 50);
  slider_direct = createSlider(-45, 45, 0);
  slider_direct.position(440, 50);
  
  rain_sound.loop();
}

function draw() { 
  if(frameCount % 4 === 0) {
    speed = slider_spd.value();
    density = slider_dens.value();
    direction = slider_direct.value();
    rain_sound.volume(map(speed * density, 0.5, 40, 0.1, 1));
    
    background(70);
    // draw the panel
    drawPanel();
    
    gradientBackground(0, height - height * 0.3, width, height * 0.3, color(70), color(20));
    
    drawRain(speed, density, direction);
  }
}

function drawRain(spd, dense, dir) {
  for(let n = 0; n < 10 + 10 * dense; n ++) {
    let posX = randomGaussian(width/2, width/2);
    let posY = random(height + spd * 10 * 10);
    drawRainDrop(posX, posY, spd, dir);
  }
}

function drawRainDrop(x, y, spd, dir) {
  push();
  translate(x, y);
  rotate(dir);
  for(let l = 0; l < 5 + spd * 10; l++) {
    stroke(250, map(l, 0, 5 + spd * 10, 40, 250))
    line(0, (l - 6 - spd * 10) * 7, 0, (l - 5 - spd * 10) * 7);
  }
  pop();
  // draw ripple on the ground
  if(y > height - height * 0.2) {
    drawRipple(x + random(-50, 50), y + random(-20, 20), spd);
  }
}

function drawRipple(x, y, spd) {
  push();
  stroke(255, 220);
  let scale = random(0.8, 1.2);
  let width = (15 + spd * 12) * scale;
  let height = (5 + spd * 3) * scale;
  arc(x, y, width, height, -60, 240);
  pop();
}

function gradientBackground(x, y, w, h, col1, col2) {
  push();
  for(let i = 0; i < h; i += 0.1) {
    let cur_color = lerpColor(col1, col2, map(i, 0, h, 0, 1));
    stroke(cur_color);
    line(x, y + i, x + w, y + i);
  }
  pop();
}

function drawPanel() {
  push();
  fill(40, 120);
  noStroke();
  rect(0, 0, width, 80)
  fill(255);
  text('Speed', 40, 30);
  text('Density', 240, 30);
  text('Direction', 440, 30);
  noFill();
  stroke(255, 180);
  strokeWeight(1);
  rect(0, 0, width/3, 80);
  rect(width/3, 0, width/3, 80);
  rect(width*2/3, 0, width/3, 80);
  pop();
}