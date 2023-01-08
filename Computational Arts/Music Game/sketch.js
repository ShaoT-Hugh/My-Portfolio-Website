var synth, notation;
var frame = 0, num = 0, clock = 4, spd = 12;
var score = 0;

const beats = [], ripples = [], strikeY = 80;
const BEAT_TYPE = ["UP", "DOWN", "LEFT", "RIGHT"];
const BEAT_IMG = [];

function preload() {
  // load the notation
  notation = loadJSON("notation.json");
  // load images
  BEAT_IMG.push(loadImage("arrows/UP.png"));
  BEAT_IMG.push(loadImage("arrows/DOWN.png"));
  BEAT_IMG.push(loadImage("arrows/LEFT.png"));
  BEAT_IMG.push(loadImage("arrows/RIGHT.png"));
}

function setup() {
  createCanvas(600, 400);
  imageMode(CENTER);
  textSize(16);
  textAlign(LEFT);
  
  synth = new Tone.Synth().toDestination();
  
  Tone.start();
}

function draw() {
  background(0);
  // let time = Tone.now();
  
  // draw the strike line
  stroke(140);
  strokeWeight(3);
  line(0, height - strikeY, width, height - strikeY);
  
  // create beats
  frame ++;
  if(frame / spd === clock) {
    let note = notation[num];
    num ++;
    clock += note[1];
    if(note[0] !== "null")
      beats.push(new Beat(random(50, width - 50), note[0], note[1] * 0.1));
    if(num >= Object.keys(notation).length) {
      frame = 0;
      num = 0;
      spd -= 4;
      clock = 4;
    }
  }
  
  // update beats
  if(beats.length > 0) {
    for(let b in beats) {
      if(beats[b].y < height)
        beats[b].show();
      else {
        beats.splice(b, 1);
        score --;
      }
    }
  }
  
  // update ripples
  if(ripples.length > 0) {
    for(let i in ripples) {
      if(ripples[i].count > 0)
        ripples[i].show();
      else
        ripples.splice(i, 1);
    }
  }
  
  // show score
  push();
  noStroke();
  fill(220);
  text("SCORE : " + score, width - 100, 40);
  pop();
}

function keyPressed() {
  let command = "";
  switch(keyCode) {
    case UP_ARROW:
      command = "UP";
      break;
    case DOWN_ARROW:
      command = "DOWN";
      break;
    case LEFT_ARROW:
      command = "LEFT";
      break;
    case RIGHT_ARROW:
      command = "RIGHT";
      break;
  }
  trigger(command);
}

function trigger(command) {
  if(beats.length > 0) {
    let ifScore = false;
    for(let [n, note] of beats.entries()) {
      if(BEAT_TYPE[note.type] === command && abs(note.y - (height - strikeY)) < 30) {
        synth.triggerAttackRelease(note.note, note.dura);
        ripples.push(new Ripple(note.x, height - strikeY));
        beats.splice(n, 1);
        score ++;
        ifScore = true;
        break;
      }
    }
    if(!ifScore) score --;
  }
}

class Beat {
  constructor(x, note, duration) {
    this.x = x;
    this.y = -50;
    this.type = floor(random(4));
    this.note = note;
    this.dura = duration;
    this.alp = 120;
  }
  
  show() {
    // update the beat
    if(this.y > height - strikeY) this.alp --;
    this.y ++;
    // draw the beat
    push();
    stroke(220, this.alp);
    fill(120, this.alp);
    circle(this.x, this.y, 60);
    tint(220, 220, 220);
    image(BEAT_IMG[this.type], this.x, this.y, 30, 30);
    pop();
  }
}

class Ripple {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.count = 100; // count down timer of the beat life cycle
  }
  
  show() {
    let p = (this.count - 10) / 100;
    push();
    strokeWeight(2);
    stroke(220, max(0, p * 200));
    fill(160, max(0, p * 50));
    circle(this.x, this.y, map(p, 0.9, 0, 1, 8) * 40);
    this.count--;
    pop();
  }
}