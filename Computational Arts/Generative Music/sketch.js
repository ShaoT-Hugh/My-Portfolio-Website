// require https://unpkg.com/tone
// require https://cdn.jsdelivr.net/npm/p5@1.4.0/lib/p5.js

var drum, endTime = 0;

const synth = new Tone.Synth({
  oscillator: {
    type: "triangle8", // sine, square, triangle, sawtooth, fat*
  },
  envelope: {
    attack: 0.1,
    decay: 0.1,
    sustain: 0.5,
    release: 1,
  },
  volume: -8
}).toDestination();
// const synth = new Tone.MonoSynth({
//   portamento: 0.05,
//   oscillator: {
//     frequency: 440,
//     partialCount: 8,
//     type: "square8", // sine, square, triangle, sawtooth, fat*
//   },
//   envelope: {
//     attack: 0.05,
//     decay: 0.2,
//     sustain: 0.3,
//     release: 0.8,
//   },
//   filter: {
//     rolloff: -12,
//     type: "lowpass"
//   },
//   filterEnvelope: {
//     baseFrequency: 300,
//     attack: 0.001,
//     decay: 0.7,
//     sustain: 0.1,
//     release: 0.8,
//     octaves: 4
//   },
//   volume: -6
// }).toDestination();

const rects = [], timers = [];
const palette = ['f94144', 'f3722c', 'f8961e', 'f9c74f', '90be6d', '4d908e', '277da1'];
const tempoComb = [
  ["2", "2"], ["2", "1", "1"], ["1", "1", "1", "1"]
]

var notes = [];
const Dorian = ["A4", "B4", "C5", "D5", "E5", "F#5", "G5"];
const Mixolydian = ["A4", "B4", "C#5", "D#5", "E5", "F#5", "G5"];

const tempo1 = [ // for 4/4 time
  ["4n", "8n", "4n", "8n", "8n", "8n"],
  ["8n", "8n", "4n", "8n", "8n", "8n"]
]
const tempo2 = [ // for 4/8 time
  ["8n", "8n", "8n", "8n", "8n", "4n", "4n", "4n", "8n", "4n", "4n"],
  ["8n", "8n", "8n", "8n", "8n", "4n", "8n", "8n", "4n", "8n", "2n"],
  ["8n", "8n", "8n", "8n", "8n", "4n", "rest%8n", "8n", "8n", "4n", "4n", "4n"],
  ["8n", "8n", "8n", "8n", "8n", "8n", "8n", "8n", "8n", "8n", "rest%8n", "8n", "8n", "8n", "rest%4n"]
]

function generate() {
  // choose a tempoComb
  let comb = tempoComb[floor(random(tempoComb.length))];
  let melody = [];
  
  for(let type of comb) {
    melody = melody.concat(generateMeasure(type));
  }
  
  return melody;
}

function generateMeasure(tempo_type) {
  const measure = [];
  
  // choose a tempo
  let timeLeft, tempo = [];
  if(tempo_type === "1") {
    Tone.Time("1m");
    tempo = tempo1[floor(random(tempo1.length))];
  } else if(tempo_type === "2") {
    Tone.Time("2m")
    tempo = tempo2[floor(random(tempo2.length))];
  }
  
  let degree = floor(random(notes.length));
  
  for(let temp of tempo) {

    let note = '', length;
    if(temp.indexOf("%") === -1) {
      // choose a note
      const change = sample([-1, -1, -1, 1, 1, 1, -2, -2, 2, 2, -3, 3]);
      degree = constrain(degree + change, 0, notes.length - 1);
      note = notes[degree];
      length = Tone.Time(temp);
    } else {
      note = "rest";
      length = Tone.Time(temp.split("%")[1]);
    }
    
    // keep track of time
    timeLeft = Tone.Time(timeLeft - length);

    // add the note to the melody
    measure.push([note, length]);
  }

  return measure;
}

function registerNewMelody(melody) {
  timers.splice(0, timers.length); // reset timers
  let t = Tone.now();
  for (const note of melody) {
    t += Tone.Time(note[1]);
    if (note[0] !== "rest") {
      synth.triggerAttackRelease(note[0], Tone.Time(note[1]) - 0.1, t);
      // create a new note rect
      Tone.Transport.scheduleOnce((time) => {
	    rects.push(new Note(note));
      }, t);
    }
  }
  return t; // return the ending time of this melody
}

function setup() {
  createCanvas(800, 600);
  noStroke();
  // rectMode(CENTER);
  
  notes = Dorian; // set up the chord
  
  endTime = registerNewMelody(generate());
  Tone.Transport.start();
  
}

function draw() {
  background(0);
  
  // loop the melody
  if(Tone.now() >= endTime) {
    endTime = registerNewMelody(generate());
    // console.log('Next Measure');
  }
  // update scores
  for(let [index, rect] of rects.entries()) {
    if(rect.x > -100) {
      rect.update();
      rect.draw();
    } else rects.splice(index, 1);
  }
}

function mousePressed() {
  
}

class Note {
  constructor(note) {
    let index = notes.indexOf(note[0]);
    this.x = width / 2;
    this.y = height - (height - notes.length * 60) / 2 - (index + 1) * 60;
    this.width = 180 * note[1].toSeconds();
    this.color = palette[index];
    this.scale = 0;
  }
  update() {
    this.x -= 3;
    if(this.scale <= PI / 2) this.scale += 0.2;
  }
  draw() {
    push();
    translate(this.x, this.y);
    scale(map(sin(this.scale), 0, 1, 0.1, 1));
    fill('#' + this.color);
    rect(0, 0, this.width, 60, 15, 15, 15, 15);
    pop();
  }
}

function sample(data) {
  const index = floor(random(data.length));
  return data[index];
}

// function constrain(v, minium, maxium) {
//   return min(maxium, max(minium, v));
// }