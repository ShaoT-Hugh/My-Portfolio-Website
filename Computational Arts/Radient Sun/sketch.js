// require https://cdn.jsdelivr.net/npm/p5@latest/lib/p5.min.js
// require https://cdn.jsdelivr.net/npm/tweakpane@3.0.7/dist/tweakpane.min.js

var particles = [], particles3D = [];

// set up the panel
const panelParam = {
  Color: 0,
  Sun_Size: 5,
  Intensity: 5,
}
const pane = new Tweakpane.Pane();

pane.addInput(panelParam, 'Color', {min: 0, max: 1, step: 0.01});
pane.addInput(panelParam, 'Sun_Size', {min: 1, max: 10, step: 0.5});
pane.addInput(panelParam, 'Intensity', {min: 1, max: 10, step: 0.1});

function setup() {
  let edge = windowWidth < windowHeight ? windowWidth : windowHeight ;
  createCanvas(edge, edge);
  noStroke();
  colorMode(HSB, 1);
  angleMode(DEGREES);
  // noLoop();
}

function draw() {
  background(0);
  translate(width/2, height/2);
  
  let t = frameCount / 100;
  
  // draw the sun
  let sunSize = panelParam.Sun_Size;
  let intens = panelParam.Intensity;
  
  let radius = sunSize * 6;
  let nlayer = sunSize * 4;
  let interval = 1;
  let noisiness = map(intens, 1, 10, 10, 50);
  let maxRadius = radius + 2 * nlayer * interval + noisiness;
  drawSun(nlayer, interval, radius, noisiness, t);
  
  // create particles
  if(frameCount % 4 === 0) {
    let freq = random(10), maxSpd = map(intens, 1, 10, 0.5, 1.2);
    if(freq < intens) {
      let dir = random(0, 360);
      let x = maxRadius * cos(dir), y = maxRadius * sin(dir);
      particles.push(new particle(x, y, random(4, 8), dir, random(maxSpd - 0.4, maxSpd), {h: panelParam.Color, s: random(0.6, 1), l: 0.7}));
      if(freq < intens / 2) {
        let dir3d = random(0, 360);
        let x3d = maxRadius * cos(dir3d), y3d = maxRadius * sin(dir3d);
        particles3D.push(new particle3D(x3d, y3d, random(2, 6), dir3d, random((maxSpd - 0.4)/2, maxSpd/2), {h: panelParam.Color, s: random(0.6, 1), l: 0.7}, random(0.5, 1.5)));
      }
    }
  }
  // update particles
  if(particles.length > 0) {
    for(let p in particles) {
      if(particles[p].update()) {
        particles.splice(p, 1);
      } else {
        particles[p].draw();
      }
    }
  }
  // update 3D particles
  if(particles3D.length > 0) {
    for(let p in particles3D) {
      if(particles3D[p].update()) {
        particles3D.splice(p, 1);
      } else {
        particles3D[p].draw();
      }
    }
  }
}

function drawSun(nlayer, inter, radius, noisiness, t) {
  let n = nlayer, step = 0.01, kMax = 2, maxNoise = noisiness;
  let minRadius = radius, interval = inter;
  let col = panelParam.Color;
  for (let i = 2 * n; i > 0; i--) {
	let alpha = 1 - (i / (2 * n));
	fill((alpha/10 + panelParam.Color) % 1, 1, alpha * 1.5, 1);
	let size = minRadius + i * interval;
	let k, noiseScale;
	if (i < n) {
	  k = kMax * sqrt(i/n);
	  noiseScale = maxNoise * (i/n);
	} else {
	  k = kMax * sqrt(1 - (i - n)/n);
	  noiseScale = maxNoise * (1 - (i - n)/n);
	}
    drawBlob(size, 0, 0, k, t - i * step, noiseScale, maxNoise);
  }
}

function drawBlob(size, xCenter, yCenter, k, t, noisiness, sec) {
  beginShape();
  let angleStep = 360 / sec;
  for (let theta = 0; theta <= 360 + 2 * angleStep; theta += angleStep) {
	let r1 = cos(theta) + 1, r2 = sin(theta) + 1;
    let r = size + noise(k * r1,  k * r2, t) * noisiness;
    let x = xCenter + r * 2 * cos(theta);
    let y = yCenter + r * 2 * sin(theta);
    curveVertex(x, y);
  }
  endShape(CLOSE);
}

class particle {
  constructor(x, y, size, dir, spd, col) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.dir = dir;
    this.spd = spd;
    this.col = col;
    this.col_h = col.h + 0.1;
    this.count = 0;
  }
  update() {
    this.x += cos(this.dir) * this.spd;
    this.y += sin(this.dir) * this.spd;
    if(this.count < 0.1) this.count += 0.001;
    this.col.h = (this.col_h - this.count) % 1;
    this.col.l -= 0.001;
    
    let x = this.x, y = this.y, s = this.size;
    // check if leave the canvas
    if(x < 0-width/2 - s || x > width/2 + s || y < 0-height/2 - s || y > height/2 + s)
      return true;
    else return false;
  }
  draw() {
    let x = this.x, y = this.y;
    push();
    fill(this.col.h, this.col.s, this.col.l);
    ellipse(x, y, this.size);
    pop();
  }
}

class particle3D extends particle{
  constructor(x, y, size, dir, spd, col, size_rate) {
    super(x, y, size, dir, spd, col);
    this.rate = size_rate;
  }
  update() {
    this.x += cos(this.dir) * this.spd;
    this.y += sin(this.dir) * this.spd;
    if(this.count < 0.1) this.count += 0.001;
    this.col.h = (this.col_h - this.count) % 1;
    this.col.l -= 0.001;
    this.size += 0.05 * this.rate;
    
    let x = this.x, y = this.y, s = this.size;
    // check if leave the canvas
    if(x < 0-width/2 - s || x > width/2 + s || y < 0-height/2 - s || y > height/2 + s)
      return true;
    else return false;
  }
}

// save image
function keyPressed() {
  if(keyCode === ENTER)
    saveCanvas('Sun'+'_'+ hour() +'_'+ minute() +'_'+ second());
}