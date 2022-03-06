// assets
var _txtFont, _numFont;

// shared object
let shared, keys;

let participants;
let me;

const _countDown = 10;
var _story, _backImg, _textures = [];
const _rowNumber = 63, _textStroke = 3.5, _hintHeight = 150;

function preload() {
  partyConnect(
    "wss://deepstream-server-1.herokuapp.com",
    "Tong_Typist",
    "room_2"
  );
  shared = partyLoadShared("shared");
  count = partyLoadShared("count");
  
  me = partyLoadMyShared();
  participants = partyLoadParticipantShareds();

  // Initialize the assets
  _txtFont = loadFont("assets/Andreia_handwrite-Regular.otf");
  _numFont = loadFont("assets/Dici's Handwrite.ttf");
  _story = loadJSON("assets/Stories.json");
  _backImg = loadImage("assets/background-image.jpg");
  for(let i = 1; i <= 4; i++) _textures.push(loadImage("assets/texture0" + i + ".jpg"));
}

function setup() {
  let myCanvas = createCanvas(640, 480);
  myCanvas.parent("main");

  noStroke();
  textFont(_txtFont);
  textWrap(CHAR);
  
  // hide the info panel
  partyToggleInfo(false);

  // Initialize the game
  if(partyIsHost()) {
    shared.player_num = 0;
    shared.whole_txt = []; // the whole paragraph to complete
    shared.input_txt = []; // already input texts by players
    shared.txt_colors = []; // color for each single char
    shared.step = 0; // how much letters have been finished
    
    count.countdown = _countDown;
    shared.ifFirstRunning = true; // check if the game is run for the first time
    shared.ifRunning = false; // check if the game is running
    shared.result = false; // show the result of the game (true: succeed; false: fail)

    // initialize player's colors
    shared.player_color = shuffle(['#7EBDC3', '#25283D', '#FFBE0B', '#FB5607', '#FF006E', '#8338EC', '#3A86FF']);
    shared.total_score = 0;
  }

  // Initialize the player
  me.num = shared.player_num ++;
  me.enabled = false; // if the player is playing
  me.color = shared.player_color[me.num % shared.player_color.length]; // assign a random color to the player
  me.score = 0; // finished chars in a round
}

function draw() {
  background("#f2f2f2");
  
  // As this is supposed to be a slow-action game, update game obj will not be used
  if(partyIsHost() && shared.ifRunning) { // update game objs
    if(frameCount % 30 === 0) count.countdown --; // update the countdown
    // if the countdown equals 0 or the paragraph is finished, end the game
    if(count.countdown <= 0 || shared.step === shared.whole_txt.length) endGame();
  }
  
  gameState();
}

// manage the current game state
function gameState() {
  if(shared.ifRunning && me.enabled) { // if the game is running && player is playing
    push();
    // show the background texture
    blendMode(MULTIPLY);
    tint(220, 128);
    image(_textures[shared.texture], 0, 0, width, height);
    blendMode(BLEND);
    // show the frame
    fill(me.color);
    rect(0, height - 100, width, 100);
    noFill();
    stroke(me.color);
    strokeWeight(12);
    rect(0, 0, width, height);
    pop();
    // show the unfinished paragraph
    showParagraphAdvanced();
    // show the countdown
    showCountdown();
  } else { // if the the player is not playing
    // show the back image
    tint(220, 220, 180, 220);
    image(_backImg, 0, 0, width);
    drawRect();
    // show the title
    showText("CONTRADICTORY TYPIST", 72, color(220), -100);

    if(shared.ifRunning && !me.enabled) { // if the game is running
      showText("Please wait for next round", 32, color(220), _hintHeight);
    } else { // if the game is over, show the game result
      if(!shared.ifFirstRunning) { // if it's not 1st game, show the last game result
        push();
        textSize(64);
        textAlign(CENTER);
        if(shared.result) {
          fill(60, 255, 60);
          text("SUCCEED", width/2, height/2);
        } else {
          fill(255, 60, 60);
          text("FAIL", width/2, height/2);
        }
        // show the final score
        let contribution = constrain(round(me.score / shared.total_score * 100), 0, 100);
        textSize(40);
        fill(me.color);
        textFont(_numFont);
        text("You finished " + contribution + " % of the work.", width/2, height/2 + 60);
        pop();
      }
      // show the instruction info
      if(partyIsHost()) {
        showText("Click the Canvas to start", 32, color(220), _hintHeight, true);
      } else {
        showText("Please Wait for the Host to Start", 32, color(220), _hintHeight, true);
      }
    }
  }
}

function mouseClicked() {
  if(partyIsHost() && !shared.ifRunning) startGame();
}
// start the game and reset the values
function startGame() {
  // reset all the players
  for(var p of participants) {
    p.enabled = true;
    p.score = 0;
  }
  // initialize a new set of text
  generateParagraph();
  // choose a random background texture
  shared.texture = floor(random(_textures.length));
  // reset the countdown
  shared.step = 0;
  shared.total_score = 0;
  count.countdown = round(shared.whole_txt.length / 5);
  // set the game status to running
  shared.ifRunning = true;
  // close the ifFirstRunning
  if(shared.ifFirstRunning) shared.ifFirstRunning = false;
}
// end the game
function endGame() {
  // disable all the players
  for(var p of participants) {
    shared.total_score += p.score;
    p.enabled = false;
  }
  // check the game result
  if(shared.whole_txt.length === shared.step) shared.result = true;
  else shared.result = false;
  // set the game status to stop
  shared.ifRunning = false;
}

// when a player type, record the input keyCode and change the finished text
function keyPressed() {
  let code = keyCode;
  if(shared.step < shared.whole_txt.length && (code > 64 && code < 123)) {
    let current_code = shared.whole_txt[shared.step].charCodeAt();
  
    if(code === current_code) { // if input the correct letter, step + 1
      me.score ++;
      shared.input_txt.splice(shared.step, 1, String.fromCharCode(code));
      shared.txt_colors.splice(shared.step, 1, me.color);
      shared.step ++;
      if(shared.whole_txt[shared.step] === " ") shared.step ++;
    } else if(code === current_code - 32) {
      me.score ++;
      shared.input_txt.splice(shared.step, 1, String.fromCharCode(code + 32));
      shared.txt_colors.splice(shared.step, 1, me.color);
      shared.step ++;
      if(shared.whole_txt[shared.step] === " ") shared.step ++;
    } else if(shared.step > 0) { // if input a wrong letter, step - 1
      me.score --;
      shared.step --;
      if(shared.whole_txt[shared.step] === " ") shared.step --;
      shared.input_txt.splice(shared.step, 1, '');
      shared.txt_colors.splice(shared.step, 1, '#ffffff');
    }
  } else if(code === ALT) {
    saveCanvas("ScreenShot", "jpg"); // print the screen
  }
}

// generate a new set of text
function generateParagraph() {
  let psg = _story[floor(random(Object.keys(_story).length))];
  // let psg = _story[0]; // for test

  let txt0 = [], txt1 = [], color = [];
  for(let i = 0; i < psg.length; i++) {
    txt0.push(psg[i]);
    txt1.push(' ');
    color.push('#ffffff');
  }
  shared.whole_txt = txt0; // array
  shared.input_txt = txt1;
  shared.txt_colors = color;
}

// show the unfinished paragraph
function showParagraph() {
  let str0 = shared.whole_txt.join(''), str1 = shared.input_txt.join('');
  
  push();
  textAlign(LEFT);
  textSize(32);
  fill(90);
  noStroke();
  text(str0, 40, 120, width - 80);
  // overlap the underlying texts
  noFill();
  stroke(220, 20, 20);
  strokeWeight(_textStroke);
  text(str1, 40, 120, width - 80);
  pop();
}

function showParagraphAdvanced() {
  let str0 = shared.whole_txt, str1 = shared.input_txt, colors = shared.txt_colors;
  let row_num = _rowNumber;

  push();
  textAlign(CENTER);
  textSize(36);
  // overlap the underlying texts
  noFill();
  strokeWeight(2.5);
  for(let c = 0, n = 0; c < str1.length; c++, n++) {
    if(c % row_num === 0) n = 0;
    stroke(colors[c]);
    text(str1[c], 40 + n * 9, 120 + floor(c / row_num) * 32);
  }

  fill(90);
  noStroke();
  for(let c = 0, n = 0; c < str0.length; c++, n++) {
    if(c % row_num === 0) n = 0;
    text(str0[c], 40 + n * 9, 120 + floor(c / row_num) * 32);
  }
  pop();
}

// show text
function showText(txt, size, col, offsetY = 0, blink = false) {
  push();
  textSize(size);
  textAlign(CENTER);
  fill(col);
  if(blink) {
    if(frameCount % 120 < 60) {
      text(txt, width/2, height/2 + offsetY);
    }
  } else text(txt, width/2, height/2 + offsetY);
  pop();
}
function drawRect() {
  push();
  fill(80, 160);
  rect(0, 0, width, height);
  pop();
}

// show the countdown
function showCountdown() {
  let num = count.countdown;
  push();
  textFont(_numFont);
  if(num > 3) fill(0);
  else fill(220, 0, 0);
  textSize(32);
  textAlign(CENTER);
  text(num, width/2, 60);
  pop();
}
