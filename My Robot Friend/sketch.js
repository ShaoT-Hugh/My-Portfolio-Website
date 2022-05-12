// parameters
const SCREEN_WIDTH = 1080, SCREEN_HEIGHT = 720;
const BUTTON_WIDTH = 320, BUTTON_HEIGHT = 210, BUTTON_POS = [[270, 150], [810, 150], [270, 390], [810, 390]];
const TEXT_BOX_POS = 60, TEXT_SIZE = 32;
const RESULT_POS = 50;
var CHOICE = {A: 0, B: 0, C: 0, D: 0}, Choices = [];
var text_font;

var SCENE_manager, ASSETS_manager;
var SCENE_data;

function preload() {
  // load stories
  SCENE_data = loadJSON("scenes.json");

  text_font = loadFont("assets/Dici's Handwrite.ttf");

  ASSETS_manager = new Map();
  // load images
  ASSETS_manager.set("Andrew", loadImage("assets/Andrew.jpg"));
  ASSETS_manager.set("Doraemon", loadImage("assets/Doraemon.jpg"));
  ASSETS_manager.set("Sonny", loadImage("assets/Sonny.jpg"));
  ASSETS_manager.set("WallE", loadImage("assets/WallE.jpg"));
  // load illustrations
  ASSETS_manager.set("Main_button", loadImage("assets/main_button.png"));
  ASSETS_manager.set("Start_button", loadImage("assets/start_button.png"));
  ASSETS_manager.set("Retry_button", loadImage("assets/retry_button.png"));
  ASSETS_manager.set("Textbox", loadImage("assets/text_box.png"));

  for(let i = 1; i <= 4; i++) {
    ASSETS_manager.set("Button" + i, loadImage("assets/button" + i + ".png"));
    ASSETS_manager.set("ClickedButton" + i, loadImage("assets/button" + i + "_clicked.png"));

    ASSETS_manager.set("Head" + i, loadImage("assets/head" + i + ".png"));
    ASSETS_manager.set("Eyes" + i, loadImage("assets/eyes" + i + ".png"));
    ASSETS_manager.set("Hand" + i, loadImage("assets/hand" + i + ".png"));
    ASSETS_manager.set("Leg" + i, loadImage("assets/leg" + i + ".png"));
  }
  ASSETS_manager.set("Body", loadImage("assets/body.png"));
}

function setup() {
  createCanvas(SCREEN_WIDTH, SCREEN_HEIGHT);
  textFont(text_font);
  
  SCENE_manager = SceneManger.get();

}

function draw() {
  background(250);

  SCENE_manager.render();
}

class SceneManger {
  static get(){
    if(!this.instance) this.instance = new SceneManger();
    return this.instance;
  }
  constructor() {
    this.sceneNum = -1;

    // set up the START button
    this.start_button = createSprite(width/2, height/2 + 100);
    this.start_button.addImage(ASSETS_manager.get("Start_button"));
    this.start_button.onMousePressed = function() {
      SCENE_manager.nextScene(); // enter the first scene
    }
    // set up the RETRY button
    this.retry_button = createSprite(width - 100, RESULT_POS);
    this.retry_button.addImage(ASSETS_manager.get("Retry_button"));
    this.retry_button.onMousePressed = function() {
      SCENE_manager.restart(); // back to the first scene
    }
    // set up the text box
    this.textbox = createSprite(width/2, height - 100, SCREEN_WIDTH - 20, 180);
    // this.textbox.shapeColor = color(80);
    this.textbox.addImage(ASSETS_manager.get("Textbox"));
    this.textbox.mouseActive = true;
    this.textbox.onMousePressed = function() {
      SCENE_manager.nextScene(); // attempt to enter next scene
    }
    // add button sprites to one group
    this.buttons = new Group();
    // set up the choice buttons
    for(let i = 0; i < 4; i++) {
      let new_choice = createSprite(BUTTON_POS[i][0], BUTTON_POS[i][1], BUTTON_WIDTH, BUTTON_HEIGHT);
      new_choice.addImage(ASSETS_manager.get("Button" + (i + 1)));
      new_choice.onMousePressed = function() {
        SCENE_manager.makeChoice(i);
      };
      this.buttons.add(new_choice);
    }

    this.cur_choice = null;
    this.text = null;
    this.ifReady = true; // if the current scene has been completely shown
  }

  restart() { // reset the game state to the original
    CHOICE = {A: 0, B: 0, C: 0, D: 0}; // reset the choices
    Choices = [];
    this.sceneNum = 2;
    this.text = null;
    this.nextScene();
  }
  makeChoice(i) { // chenge the current choice to match the corresponding button
    this.cur_choice = i;
  }
  checkResult() {
    console.log(Choices);
    let res = 0, highest = 0;
    for(let cho in CHOICE)
      if(CHOICE[cho] > highest) {
        highest = CHOICE[cho];
        res = cho;
      }
    switch(res) {
      case "A":
        res = 1;
        break;
      case "B":
        res = 2;
        break;
      case "C":
        res = 3;
        break;
      case "D":
        res = 4;
        break;
    }
    return res;
  }
  drawResult() {
    let x = width/2 - 40, y = RESULT_POS, w = 580, h = 500;
    push();
    imageMode(CORNER);
    image(ASSETS_manager.get("Leg" + (Choices[3] + 1)), x, y, w, h); // draw legs
    image(ASSETS_manager.get("Body"), x, y, w, h); // draw body
    image(ASSETS_manager.get("Hand" + (Choices[2] + 1)), x, y, w, h); // draw arms
    image(ASSETS_manager.get("Head" + (Choices[0] + 1)), x, y, w, h); // draw head
    image(ASSETS_manager.get("Eyes" + (Choices[1] + 1)), x, y, w, h); // draw eyes
    pop();
  }

  enableButtons(enable) {
    // for(let btn of this.choices) {
    //   btn.mouseActive = enable;
    // }
    this.buttons.mouseActive = enable;
  }
  showButtonFrame() {
    let x = BUTTON_POS[this.cur_choice][0];
    let y = BUTTON_POS[this.cur_choice][1];
    push();
    imageMode(CENTER);
    stroke(255);
    strokeWeight(4);
    image(ASSETS_manager.get("ClickedButton" + (this.cur_choice + 1)), x, y);
    pop();
  }
  showButtonTexts() {
    push();
    // draw illustrations
    textAlign(CENTER);
    textSize(TEXT_SIZE);
    for(let i = 0; i < 4; i++) {
      let x = BUTTON_POS[i][0] - BUTTON_WIDTH/2, y = BUTTON_POS[i][1];
      text(SCENE_data[this.sceneNum].choices[i], x, y, BUTTON_WIDTH - 10);
    }
    pop();
  }

  nextScene() {
    // console.log(this.ifReady + ',' + this.text.ifReady);
    if(this.sceneNum < 9 && this.ifReady && this.cur_choice !== -1) { // only enter next scene when the current scene is ready
      if(this.sceneNum < 8) { // check if it is the last scene
        if(this.sceneNum >= 3) { // check if this is a choice scene
          // push the choice to the result
          let score = SCENE_data[this.sceneNum].scores[this.cur_choice];
          for(let char of score) CHOICE[char] ++;
          Choices.push(this.cur_choice);
          console.log(CHOICE);
        }
        this.sceneNum ++;
      } else this.sceneNum += this.checkResult(); // if it's the last scene, decide the result
      
      // load the new paragraphs
      this.textNum = 0;
      this.text = new PrintText(TEXT_BOX_POS, height - 140, SCENE_data[this.sceneNum].text[this.textNum]);
      // check if there is any choice in the next scene scene
      if(SCENE_data[this.sceneNum].choices !== null) {
        this.enableButtons(true); // enable all the buttons
        this.cur_choice = -1; // set the current choice to -1
      } else {
        this.enableButtons(false); // disable all the buttons
        this.cur_choice = null; // set the current choice to null
      }

      this.ifReady = false;
    } else if(this.text.ifReady && !this.ifReady) { // if the current paragraph is over, read the next paragraph
      this.textNum ++;
      this.text = new PrintText(TEXT_BOX_POS, height - 140, SCENE_data[this.sceneNum].text[this.textNum]);
    } else if(!this.text.ifReady){ // if the current paragraph is not ready yet, make it ready immediately
      this.text.finish();
    }
  }

  update() {
    // update buttons
    // update printing texts
    if(!this.text.ifReady && frameCount % 4 === 0) this.text.update();
    else if(this.text.ifReady && !this.ifReady && this.textNum === SCENE_data[this.sceneNum].text.length - 1) this.ifReady = true;
  }
  render() {
    if(this.sceneNum > -1) {
      this.update(); // update all the objects

      // background image
      if(SCENE_data[this.sceneNum].image) image(ASSETS_manager.get(SCENE_data[this.sceneNum].image), 60, RESULT_POS, 390, 580); // show the image

      // buttons
      if(SCENE_data[this.sceneNum].choices !== null) {
        drawSprites(this.buttons); // draw the buttons
        if(this.cur_choice >= 0) this.showButtonFrame(); // show the selected button frame
        this.showButtonTexts(); // show the button texts
      } else if(this.sceneNum > 8) {
        this.drawResult(); // draw the result
        drawSprite(this.retry_button); // show the retry button
      }

      drawSprite(this.textbox); // draw the text box
      this.text.show(); // show the text
    } else {
      // show the title
      push();
      textAlign(CENTER);
      textSize(64);
      textStyle(BOLD);
      text("WHO IS YOUR BEST ROBOT FRIEND", width/2, 180);
      pop();
      drawSprite(this.start_button); // show the start button
    }
  }
}

class PrintText {
  constructor(x, y, txt, width = SCREEN_WIDTH - 80) {
    this.pos_x = x;
    this.pos_y = y;
    this.origin_content = txt;
    this.content = txt;
    this.width = width; // width of the text box

    this.text = "";
    this.ifReady = false; // if the text has been fully shown
  }
  update() {
    if(this.content.length > 0) {
      this.text += this.content[0];
      this.content = this.content.substring(1); // remove the 1st char
    } else this.ifReady = true;
  }
  finish() { // immediately show the entire texts
    this.text = this.origin_content;
    this.ifReady = true;
  }
  show(canvas = window) {
    canvas.push();
    canvas.fill(0);
    canvas.textSize(TEXT_SIZE);
    canvas.text(this.text, this.pos_x, this.pos_y, this.width);
    canvas.pop();
  }
}