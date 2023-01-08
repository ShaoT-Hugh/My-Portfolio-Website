var capture; // camera object
var ifCameraOn = false; // if the camera is in use
var tracker; // clmtracker
var assets; // dictionary to store assets

var scene_manager;
var fruit_manager;
var fruitsProduceFreq = 5;
var mouth_manager;

var _isMousePressed = false; // if the mouse if pressed

var fruits = []; // fruit images
var backgrounds = []; // background images
var button_color = ["250, 250, 250", "180,180,180", "0, 0, 0"];
var button_clicked = ["255, 51, 153"];
var dfont;
var gravity = 0.02;
var w = 600; // width of the camera
var h = 400; // height of the camera
var buffer = false;
var buffer_timer; // timer used to buffer the mouse click

function preload(){
  // Initialize assets
  assets = new Map();
  // load sounds
  assets.set("button_sound", loadSound('sounds_button.wav'));
  assets.set("eaten_sound", loadSound('crunch.ogg'));
  // load fruits images
  fruits[0] = loadImage('fruit_images/apple.png');
  fruits[1] = loadImage('fruit_images/pear.png');
  fruits[2] = loadImage('fruit_images/orange.png');
  fruits[3] = loadImage('fruit_images/mango.png');
  fruits[4] = loadImage('fruit_images/peach.png');
  // load background images
  backgrounds[0] = loadImage('background_images/Menu background.jpg');
  backgrounds[1] = loadImage('background_images/background_1.jpg');
  backgrounds[2] = loadImage('background_images/background_2.jpg');
  backgrounds[3] = loadImage('background_images/background_3.jpg');
}
function setup() {
  let myCanvas = createCanvas(w, h);
  myCanvas.parent("main");
  
  dfont = loadFont('big_noodle_titling.ttf'); // load fonts
  textFont(dfont);
  pixelDensity(1);
  imageMode(CENTER);
  angleMode(DEGREES);
  
  // load clmtrackr functions:
  tracker = new clm.tracker(); // create a new clmtrackr object
  tracker.init(); // initialize clmtrackr
  
  // Initialize managers
  scene_manager = new sceneManager();
  fruit_manager = new fruitManager();
  mouth_manager = new mouthManager(100, 30, 30);
  
  scene_manager.startButton.enabled = true;
}

function draw() {
  background(255);
  
  let featurePts = [];
  if(ifCameraOn){
    featurePts = tracker.getCurrentPosition(); // update the tracker
  }
  // if(featurePts.length > 0){ // show the feature points
  //   stroke(255, 0, 0);
  //   strokeWeight(3);
  //   textSize(15);
  //   beginShape(POINTS);
  //   for(let i in featurePts){
  //     vertex(featurePts[i][0], featurePts[i][1]);
  //     noStroke();
  //     text(i, featurePts[i][0], featurePts[i][1]);
  //   }
  //   endShape();
  // }
  scene_manager.update(featurePts);
}

// open & close the camera
function cameraCtrl(command){
  // command: true -> start; false -> stop
  if(command){
      // Initialize the camera
      capture = createCapture({
          audio: false,
          video: {
              width: w,
              height: h
          }
      }, function() {
          console.log('capture ready.')
      });
      capture.elt.setAttribute('playsinline', '');
      capture.size(w, h);
      capture.hide();
      tracker.reset();
      tracker.start(capture.elt); // attach the capture to the tracker
      ifCameraOn = true;
  }else{
    tracker.stop();
    capture.remove();
    ifCameraOn = false;
  }
}

// check if the mouse is pressed
function mousePressed(){
  _isMousePressed = true;
}
function mouseReleased(){
  _isMousePressed = false;
}


// show the degree of accuracy of the fitting model
function showScore(){
  let score = tracker.getScore();
  let ifTracked;
  let ifTracked_r;
  if(score > 0.5){
    fill(0, 200, 0);
    ifTracked = 'In Track';
    ifTracked_r = true;
  }else{
    fill(200, 0, 0);
    ifTracked = 'Lost Track';
    ifTracked_r = false;
  }
  textSize(25);
  textAlign(LEFT);
  text(ifTracked + '(' + round(score * 100) + ')', 20, 35);
  return ifTracked_r;
}

class sceneManager{
  constructor(){
    this.sceneNum = 0;
    this.backgroundImg = 0;
    this.ifCameraOn = false;
    this.ifShowyourselfOn = false;
    this.score = 0;
    
    // ask player for the permission of camera
    this.ifCamera = new sprite(w/2, h/2, w/2, h/2, 350, 260, "The game needs to access your \ncamera, please turn on the \npermission for the camera.");
    let offsetX1 = this.ifCamera.otargt_x - this.ifCamera.width/2, offsetY1 = this.ifCamera.otargt_y - this.ifCamera.height/2;
    this.ifCamera.buttons = [
      new cusButton(this.ifCamera.width/2 + 100, 230, 100, 30, function(){
        scene_manager.ifCameraOn = true;
        scene_manager.ifCamera.leave();
      }, 0, "I agree", "0, 0, 0", 22, offsetX1, offsetY1),
      new cusButton(this.ifCamera.width/2 - 100, 230, 100, 30, function(){
        scene_manager.ifCamera.leave();
      }, 0, "I refuse", "0, 0, 0", 22, offsetX1, offsetY1)
    ];
    
    // ask player if they want to see themselves on the screen
    this.ifShowyourself = new sprite(w/2, h/2, w/2, h/2, 350, 260, "Do you want to see yourself \non the screen?\n(You can always turn it off in \nthe game)");
    let offsetX2 = this.ifShowyourself.otargt_x - this.ifShowyourself.width/2, offsetY2 = this.ifShowyourself.otargt_y - this.ifShowyourself.height/2;
    this.ifShowyourself.buttons = [
      new cusButton(this.ifShowyourself.width/2 + 100, 230, 100, 30, function(){
        scene_manager.ifShowyourselfOn = true;
        scene_manager.ifShowyourself.leave();
      }, "120,120,120", "Yes", "0, 0, 0", 22, offsetX2, offsetY2),
      new cusButton(this.ifShowyourself.width/2 - 100, 230, 100, 30, function(){
        scene_manager.ifShowyourself.leave();
      }, "120,120,120", "No", "0, 0, 0", 22, offsetX2, offsetY2)
    ];
    
    // level buttons
    this.levels = [];
    for(let i = 0; i < 3; i++){
      this.levels.push(new cusButtonImg(w/2 - 180 + 180 * i, h/2 + 40, 150, 100, function(){
        scene_manager.backgroundImg = i + 1;
        for(let i = 0; i < 3; i++){
          scene_manager.levels[i].enabled = false; // disable all the level buttons
        }
        scene_manager.sceneNum ++;
        fruit_manager.clearFruit();
        scene_manager.camera.enabled = true;
        scene_manager.exit.enabled = true;
      }, "Stage " + (i + 1), backgrounds[i + 1]));
    }
    
    // in-game buttons
    this.camera = new cusButton(440, 360, 80, 30, function(){
      if(scene_manager.ifShowyourselfOn) scene_manager.ifShowyourselfOn = false;
      else scene_manager.ifShowyourselfOn = true;
    }, 1, "CAMERA", "0, 0, 0", 23);
    this.exit = new cusButton(540, 360, 80, 30, function(){
      fruit_manager.clearFruit();
      fruit_manager.fruitsEaten = 0;
      scene_manager.camera.enabled = false;
      scene_manager.exit.enabled = false;
      scene_manager.startButton.enabled = true;
      scene_manager.sceneNum = 0;
      scene_manager.ifCameraOn = false;
      mouth_manager.clear();
      cameraCtrl(false); // stop tracking
    }, 2, "EXIT", "255,255,255", 23);
    
    this.ifExit = new sprite(w/2, -100, w/2, h/2, 200, 120, "Back to menu?");
    this.ifExit.buttons = [];
    
    this.startButton = new cusButton(w/2, 300, 150, 60, function(){
      scene_manager.sceneNum ++;
      scene_manager.ifCamera.reset();
    }, 0, "START", "0, 0, 0", 32);
  }
  
  switchScene(num){ // switch the scene
    this.sceneNum = num;
  }
  
  update(featurePts){
    let ifProduce = random(0, 100);
    // show the menu background before game start
    if(this.sceneNum < 4){
      push();
      imageMode(CORNER);
      image(backgrounds[0], 0, 0);
      pop();
      // update the fruits
      fruit_manager.update();
      fruit_manager.render();
      
      // white mask
      if(this.sceneNum > 0){
        fill(255, 150);
        rect(0, 0, w, h);
      }
    }
    
    switch(this.sceneNum){
    case 0: // start scene
      fill(25);
      textAlign(CENTER);
      textSize(60);
      text("EAT FRUITS", w/2, h/2 - 20);
      this.startButton.render();
      break;
    case 1: // ask player for the permission of camera
      this.ifCamera.update();
      this.ifCamera.render();
      let frame1 = this.ifCamera;
      if(frame1.isReady && frame1.isLeave){
        if(this.ifCameraOn){ // if the player consent, go to the next stage
          this.sceneNum ++;
          cameraCtrl(true); // start tracking
          this.ifShowyourself.reset();
        }else{ // if the player refuse, back to menu
          this.sceneNum --;
          scene_manager.startButton.enabled = true; // active the start button
        }
      }
      break;
    case 2: // ask player if they want to show themselves on the screen
      this.ifShowyourself.update();
      this.ifShowyourself.render();
      let frame2 = this.ifShowyourself;
      if(frame2.isReady && frame2.isLeave){
        this.sceneNum ++;
        // active the level buttons
        for(let i = 0; i < 3; i++){
          this.levels[i].enabled = true;
        }
      }
      break;
    case 3: // choose the level
      fill(25);
      textAlign(CENTER);
      textSize(48);
      text("Choose a stage", w/2, h/2 - 60);
      for(let i = 0; i < 3; i++){
        this.levels[i].render();
      }
      break;
    case 4: // play space
      if(this.ifShowyourselfOn){ // update the camera
        push();
        translate(w, 0);
        scale(-1, 1);
        image(capture, w/2, h/2, width, height);
        tint(255, 30);
        image(backgrounds[this.backgroundImg], w/2, h/2);
        pop();  
      }else{
        push();
        image(backgrounds[this.backgroundImg], w/2, h/2);
        pop(); 
      }
      // update the fruits
      fruit_manager.update();
      fruit_manager.render();
      fruit_manager.showScore();
      // display the current tracking status
      let ifTrack = showScore();
      // update the mouth
      mouth_manager.update(featurePts, ifTrack);
      mouth_manager.render();
      
      // randomly create fruits
      if(ifProduce < fruitsProduceFreq ? true : false){
      // createFruit(x, y, spdX, spdY, type)
      fruit_manager.createFruit(random(100, w - 100), h + 40, random(-0.2, 0.2), random(-3, -5), floor(random(0, 5)));
      }
        
      // button & score
      this.camera.render();
      this.camera.enabled = true;
      this.exit.render();
      break;
    case 5: // ask player if they want to return to menu
      fruit_manager.render();
      fill(0, 120);
      rect(0, 0, w, h); // black background
      this.ifExit.render();
      break;
    }
    
    // create fruits appearing in backgrounds
    // randomly create fruits
    if(this.sceneNum < 3 && ifProduce < fruitsProduceFreq ? true : false){
      // createFruit(x, y, spdX, spdY, type)
      fruit_manager.createFruit(random(100, w - 100), -40, random(-0.2, 0.2), 0, floor(random(0, 5)));
    }
  }
}


// customized button element
class cusButton{
  constructor(x, y, width, height, func, color = 0, text = "", text_col = "0,0,0", text_size = 24, offsetX = 0, offsetY = 0){
    this.pos_x = x;
    this.pos_y = y;
    this.width = width;
    this.height = height;
    this.offset_x = offsetX;
    this.offset_y = offsetY;
    
    this.func = func;
    this.color = color;
    this.text = text;
    this.text_color = text_col;
    this.text_size = text_size;
    this.enabled = false; // if the button is enabled
    this.Clicked = false;
  }
  
  // check if the mouse is on the button
  ifMouseOn(){
    let x = this.pos_x + this.offset_x, y = this.pos_y + this.offset_y, w = this.width, h = this.height;
    let mx = mouseX, my = mouseY;
    if(mx > x + w/2 || mx < x - w/2 || my > y + h/2 || my < y - h/2)
      return false;
    else return true;
  }
  // check if the button is clicked
  ifClicked(){
    if(this.ifMouseOn() && !buffer){
      this.Clicked = true;
      assets.get("button_sound").play(); // play the button clicked sound
      this.func(); // trigger the button
      this.enabled = false; // if the button is clicked, disable it
      // start buffer
      buffer = true;
      buffer_timer = setTimeout(function(){
        buffer = false;
        clearTimeout(buffer_timer);
      }, 500);
    }else this.Clicked = false;
  }
  
  render(canvas = window){
    let x = this.pos_x, y = this.pos_y, w = this.width, h = this.height;
    // check if the button is clicked
    if(this.enabled && _isMousePressed && !this.Clicked) this.ifClicked();
    if(!_isMousePressed && this.Clicked) this.Clicked = false;
    
    canvas.push();
    canvas.rectMode(CENTER);
    canvas.textAlign(CENTER);
    canvas.textSize(this.text_size);
    if(!this.Clicked){
      canvas.stroke(75);
      canvas.strokeWeight(3);
      canvas.fill('rgb(' + button_color[this.color] + ')');
      canvas.rect(x, y, w, h);
      canvas.noStroke();
      canvas.fill('rgb(' + this.text_color + ')');
      canvas.text(this.text, x, y + this.text_size/2 - 5);
    }else{
      canvas.stroke(75);
      canvas.strokeWeight(3);
      canvas.fill('rgb(' + button_clicked[this.color] + ')');
      canvas.rect(x, y, w, h);
      canvas.noStroke();
      canvas.fill('rgb(' + this.text_color + ')');
      canvas.text(this.text, x, y + this.text_size/2 - 5);
    }
    canvas.pop();
  }
}

// Image button element
class cusButtonImg extends cusButton{
  constructor(x, y, width, height, func, text, img){
    super(x, y, width, height, func, "0, 0, 0", text);
    this.text_size = 28;
    this.img = img;
  }
  
  render(canvas = window){
    let x = this.pos_x, y = this.pos_y, w = this.width, h = this.height;
    // check if the button is clicked
    if(this.enabled && _isMousePressed && !this.Clicked) this.ifClicked();
    if(!_isMousePressed && this.Clicked) this.Clicked = false;
    
    canvas.push();
    canvas.imageMode(CENTER);
    canvas.rectMode(CENTER);
    canvas.textAlign(CENTER);
    canvas.textSize(this.text_size);
    canvas.image(this.img, x, y, w, h);
    // check if the mouse is on the button
    if(this.ifMouseOn()){
      canvas.fill(255, 75);
      canvas.rect(x, y, w + 10, h + 10);
      canvas.fill('rgb(' + this.text_color + ')');
      canvas.text(this.text, x, y + this.text_size/2 - 5);
    }
    canvas.pop();
  }
}

// sprites refer to all the individual changable elements on the screen
class sprite{
  constructor(x, y, tx, ty, w, h, text = "", rate = 15){
    this.opos_x = x; // initial x position
    this.opos_y = y; // initial y position
    this.otargt_x = tx; // initial target x position
    this.otargt_y = ty; // initial target y position
    this.pos_x = x; // current x position
    this.pos_y = y; // current x position
    this.targt_x = tx; // target x position
    this.targt_y = ty; // target y position
    this.width = w; // width of the sprite
    this.height = h; // height of the sprite
    this.rate = rate; // bigger to slower the moving spd
    this.isReady = false; // inform if the sprite has reach the right position
    this.isLeave = false; // inform if the sprite has left
    
    this.text = text; // text showing on the sprite
    this.graphic = createGraphics(w, h); // the render canvas
    this.graphic.textFont(dfont);
    this.graphic.textSize(27);
    this.graphic.textAlign(CENTER);
    this.buttons = [];
  }
  // reset all the parameter of the sprite
  reset(){
    this.pos_x = this.opos_x;
    this.pos_y = this.opos_y;
    this.targt_x = this.otargt_x;
    this.targt_y = this.otargt_y;
    this.isLeave = false;
    // reset all the buttons
    for(let i = 0; i < this.buttons.length; i++){
      this.buttons[i].enabled = true;
    }
  }
  // remove the sprite from the canvas
  leave(){
    this.targt_x = width - this.opos_x;
    this.targt_y = this.opos_y;
    this.isReady = false;
    this.isLeave = true;
  }

  move(){
    let x = this.pos_x, y = this.pos_y, v = this.rate;
    let tx = this.targt_x, ty = this.targt_y;
    // if the current postion does not match the target position, move the sprite
    if(x !== tx || y !== ty){
      this.pos_x += (tx - x) / v;
      this.pos_y += (ty - y) / v;
      // if the current position get close enough to the target, stop moving
      if(abs(this.pos_x - tx) < 1) this.pos_x = tx;
      if(abs(this.pos_y - ty) < 1) this.pos_y = ty;
    }
  }
  
  update(){
    let x = this.pos_x, y = this.pos_y;
    if(x !== this.targt_x || y !== this.targt_y){
      this.move();
      this.isReady = false;
    }else this.isReady = true;
  }
  
  render(){
    let canvas = this.graphic;
    canvas.push();
    canvas.fill(255, 150);
    canvas.rect(0, 0, this.width, this.height);
    canvas.fill(0);
    canvas.text(this.text, this.width/2, this.height/2 - 60);
    canvas.pop();
    // render the buttons
    for(let i = 0; i < this.buttons.length; i++){
      this.buttons[i].render(canvas);
    }
    
    image(canvas, this.pos_x, this.pos_y);
  }
}

class mouthManager{
  constructor(maxhis, threshold, cd, size = 80){
    // position & size of the mouth
    this.pos_x = w/2;
    this.pos_y = h/2;
    this.size = size;
    
    this.mouthHistory = [];
    this.maxHistory = maxhis;
    this.changeThreshold = threshold;
    
    this.isOpened = false;
    this.coolDown = 0;
    this.coolDownFrame = cd;
    
    this.alert = "";
  }
  
  // calculate past changing scope of the mouth, and check if the changing scope is beyond the threshold
  changeScope(history, threshold){
    let last = history.length - 1;
    let pre_dis = history[0][53][1] - history[0][47][1];
    let cur_dis = history[last][53][1] - history[last][47][1];
    
    if(cur_dis - pre_dis > threshold) return true;
    else return false;
  }
  
  // clear all the histories
  clear(){
    this.mouthHistory = [];
  }
  
  update(newPts, ifTrack){
    let his = this.mouthHistory;
    
    // update mouth position history
    if(newPts.length > 0){
      this.alert = "";
      if(his.push(newPts) > this.maxHistory) his.splice(0, 1);
      
      // update the mouth position(reverse the camera)
      this.pos_x = w - averageNum([newPts[44][0], newPts[50][0]]);
      this.pos_y = averageNum([newPts[44][1], newPts[50][1]]);
      this.size = max(dist(newPts[44][0], newPts[44][1], newPts[50][0], newPts[50][1]), 70);
    }else this.alert = "Unable to find the mouth";
    
    // check if the position history is enough
    if(his.length >= this.maxHistory){
      let cd = this.coolDown;
      // only happens when the face is "In Track"
      if(this.changeScope(his, this.changeThreshold) && ifTrack && cd === 0 && !this.isOpened){
        this.isOpened = true;
        this.coolDown = this.coolDownFrame;
      }else if(this.isOpened) this.isOpened = false;
    
      // cool down
      if(this.coolDown > 0) this.coolDown --;
    }
  }
  
  render(){
    let his = this.mouthHistory;
    let curPts = his[his.length - 1];
    if(his.length >= this.maxHistory){
      let top1 = createVector(w-curPts[46][0], curPts[46][1]);
      let top2 = createVector(w-curPts[48][0], curPts[48][1]);
      let bottom1 = createVector(w-curPts[54][0], curPts[54][1]);
      let bottom2 = createVector(w-curPts[52][0], curPts[52][1]);
      let left = createVector(w-curPts[44][0], curPts[44][1]);
      let right = createVector(w-curPts[50][0], curPts[50][1]);
    
      // draw the mouth
      push();
      fill(255, 0, 0);
      stroke(255, 50, 50);
      strokeWeight(4);
      curve(left.x, left.y, left.x, left.y, top1.x, top1.y, top2.x, top2.y);
      curve(left.x, left.y, top1.x, top1.y, top2.x, top2.y, right.x, right.y);
      curve(top1.x, top1.y, top2.x, top2.y, right.x, right.y, right.x, right.y);
      curve(left.x, left.y, left.x, left.y, bottom1.x, bottom1.y, bottom2.x, bottom2.y);
      curve(left.x, left.y, bottom1.x, bottom1.y, bottom2.x, bottom2.y, right.x, right.y);
      curve(bottom1.x, bottom1.y, bottom2.x, bottom2.y, right.x, right.y, right.x, right.y);
      // circle(this.pos_x, this.pos_y, 30);
      pop();
    }
    
    // show the alert
    if(this.alert !== ""){
      fill(220, 20, 20);
      textAlign(CENTER);
      textSize(26);
      text(this.alert, w/2, 100);
    }
  }
}

class fruitManager{
  constructor(){
    this.fruits = []; // all the fruit objects
    this.fruitsEaten = 0; // how many fruits have been eaten
  }
  // create a new fruit
  createFruit(x, y, spdX, spdY, type){
    this.fruits.push(new fruit(x, y, spdX, spdY, type));
  }
  // clear all the fruits on the screen
  clearFruit(){
    this.fruits = [];
  }
  // update fruits
  update(){
    if(this.fruits.length > 0){
      for(let i = 0; i <  this.fruits.length; i++){
        this.fruits[i].update();
        // if the fruit is eaten, remove it
        if(this.fruits[i].ifEaten(mouth_manager) && mouth_manager.coolDown > mouth_manager.coolDownFrame / 2){
          assets.get("eaten_sound").play(); // play the eaten sound
          this.fruitsEaten ++; // add number of fruits eaten
          this.fruits.splice(i, 1);
          continue;
        }
        // if the fruit leaves the canvas, remove it
        if(this.fruits[i].ifLeaveCanvas()) this.fruits.splice(i, 1);
      } 
    }
  }
  // render fruits
  render(canvas = window){
    if(this.fruits.length > 0){
      for(let i in this.fruits){
        this.fruits[i].render(canvas);
      }
    }
  }
  // show how many fruits have been eaten
  showScore(){
    fill(0);
    textSize(27);
    textAlign(RIGHT);
    text("Fruits Eaten : " + this.fruitsEaten, w - 20, 35);
  }
}
class fruit{
  constructor(x, y, spdX, spdY, type, accX = 0, size = 60){
    this.pos_x = x;
    this.pos_y = y;
    this.spd_x = spdX;
    this.spd_y = spdY;
    this.acc_x = accX;
    this.rotate = 0;
    this.type = type;
    this.size = size;
  }
  
  // check if the fruit has left the canvas
  ifLeaveCanvas(canvas = window){
    let x = this.pos_x, y = this.pos_y;
    let offset = 50;
    if(x < 0 - offset || x > canvas.width + offset || y < 0 - offset || y > canvas.height + offset)
      return true;
    else return false;
  }
  // check if the fruit is eaten
  ifEaten(mouth){
    let x1 = this.pos_x, y1 = this.pos_y, x2 = mouth.pos_x, y2 = mouth.pos_y, s1 = this.size / 2, s2 = this.size / 2;
    if(dist(x1, y1, x2, y2) <= s1 + s2) return true;
    else return false;
  }
  
  update(){
    this.spd_x += this.acc_x;
    this.spd_y += gravity;
    this.pos_x += this.spd_x;
    this.pos_y += this.spd_y;
    this.rotate += 3;
    if(this.rotate >= 360) this.rotate = 0;
  }
  render(canvas){
    let x = this.pos_x, y = this.pos_y;
    canvas.push();
    canvas.translate(x, y);
    canvas.rotate(this.rotate);
    canvas.image(fruits[this.type], 0, 0, this.size, this.size);
    canvas.pop();
  }
}

// calculate the average of an array
function averageNum(array){
  let sum = 0;
  for(let i in array){
    sum += array[i];
  }
  return sum / array.length;
}