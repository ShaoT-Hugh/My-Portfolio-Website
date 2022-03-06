// assets
var assets; // assets manager
var txtFont, numFont;

// shared objects
var shared, components, count;

var participants;
var me;

// enter key cooldown
var cooldownTimer = 0;
var keyCooldown = false;

var isMousePressed = false;

// managers
var sceneManager;
var FRAME_count;

const WIDTH = 640, HEIGHT = 480;
// basic grid settings
const Grid = {x: 50, y: 50, row: 8, col: 8, inter: 32};
const singlePartSize = 32;

const countDownTime = 20; // basic countdown time

// game data
var GAME_DATA; // json file of default component data
const compId = [];
var materialType, targetType, toolType;

const tutorialTexts = [
  "In this game, you are going to play a factory worker. Your task is to process some special parts with your workmates.",
  "At the beginning of the game, each of you will be assigned a tool and a raw material. You need to use your tool to modify the material into the target shape.",
  "Use W, A, S, D to move your tool on the operating desk. Press ENTER to process.",
  "There are 2 processing methods - when your tool overlaps the material, the material will be cut; if there is no overlap, your tool will become a part of the part.",
  "When the time is up, the material will be passed to the next player. If the materials have been processed by all the players, the game is over.",
  "If the final result is consistent with the target shape, you succeed; otherwise you fail.",
  "Sometimes you may be able to finish the task on your own, while sometimes you need to cooperate with your workmates - other times you may unconsciously cause trouble to your buddies :-)"
];

function preload() {
  partyConnect(
    "wss://deepstream-server-1.herokuapp.com",
    "Tong_Manufacture",
    "room_0"
  );
  shared = partyLoadShared("shared");
  count = partyLoadShared("count");
  components = partyLoadShared("components");
  
  me = partyLoadMyShared();
  participants = partyLoadParticipantShareds();

  // initialize assets
  txtFont = loadFont("assets/pixelmix.ttf");

  assets = new Map();
  // load images
  assets.set('operating_panel', loadImage("assets/OperatingPanel.png"));
  assets.set('target_panel', loadImage("assets/TargetPanel.png"));
  assets.set('tool_panel', loadImage("assets/ToolPanel.png"));
  assets.set('tool_panelMask', loadImage("assets/PanelMask.png"));
  assets.set('self_mark', loadImage("assets/PlayerMark.png"));
  assets.set('result_panel', loadImage("assets/ResultPanel.png"));
  assets.set('stamps', [loadImage("assets/Stamp_Rejected.png"), loadImage("assets/Stamp_Accepted.png")]);
  assets.set('single_parts', [
    loadImage("assets/SinglePart_0.png"), loadImage("assets/SinglePart_1.png"), loadImage("assets/SinglePart_2.png")]);
  assets.set('overlap_mark', loadImage("assets/OverlapMark.png"));
  assets.set('title_image', [
    loadImage("assets/TitleImage1.png"), loadImage("assets/TitleImage2.png"),
    loadImage("assets/TitleImage3.png"), loadImage("assets/TitleImage4.png")
  ]);
  assets.set('background_image', loadImage("assets/BackCircuit.png"));

  assets.set('tutorial_panel', loadImage("assets/TutorialPanel.png"));
  assets.set('button_tutorial', [loadImage("assets/button_tutorial_unpressed.png"), loadImage("assets/button_tutorial_pressed.png")]);
  assets.set('button_back', [loadImage("assets/button_left_unpressed.png"), loadImage("assets/button_left_pressed.png")]);
  assets.set('button_forth', [loadImage("assets/button_right_unpressed.png"), loadImage("assets/button_right_pressed.png")]);
  let tutorial_images = [];
  for(let i = 0; i < 7; i++) tutorial_images.push(loadImage("assets/Tutorial_" + i + ".png"));
  assets.set('tutorial_images', tutorial_images);
  // load sounds
  assets.set('button_click1', loadSound("assets/button.wav"));
  assets.set('button_click2', loadSound("assets/button.wav"));
  assets.set('gear_spin', loadSound("assets/gear-spinning-loop.ogg"));
  assets.set('start_bell', loadSound("assets/start_bell.mp3"));
  assets.set('end_bell', loadSound("assets/end_bell.ogg"));
  assets.set('metal_cut', loadSound("assets/metal_cut.ogg"));
  assets.set('metal_broken', loadSound("assets/metal_broken.ogg"));
  assets.set('stamp', loadSound("assets/stamp.ogg"));
  // load musics
  assets.set('title_music', loadSound("assets/jump_run_duck.mp3"));
  assets.get('title_music').setVolume(0.5);
  assets.set('play_music', loadSound("assets/S31-Winning the Race.ogg"));

  // load game data
  GAME_DATA = loadJSON("componentSetting.json");
}

function setup() {
  let myCanvas = createCanvas(WIDTH, HEIGHT);
  myCanvas.parent("main");

  noStroke();
  textFont(txtFont);

  // hide the p5 info panel
  partyToggleInfo(false);
  // initialize default component data
  materialType = GAME_DATA.materialType;
  targetType = GAME_DATA.targetType;
  toolType = GAME_DATA.toolType;
  // initialize component Ids
  materialType.forEach((c, i) => compId.push(i));

  // initialize the game
  if(partyIsHost()) {
    components.initComps = []; // initComps are components distributed to the players to be modified
    components.targetComps = []; // targetComps are final target result of the components

    shared.gameState = 0; // mark the current game state
    shared.round = 0; // mark the current round
    shared.gameResult = []; // record the game result
    shared.playerAmount = 1;
    shared.playerTools = []; // record current players' tools info
    shared.isRunning = false; // check if the game is running

    count.countdown = 4;
    shared.pauseToggle = false;
  }

  // initialize the player
  // initialize the scene manager
  sceneManager = SceneManager.get();
  me.tool = {}; // current tool type
  me.initCompId = 0; // Id of first component; used to check if the game is over
  me.curCompId = 0; // Id of currently processing component
  // toolPos: x & y - left-top position of the tool; pos: grid array with tool on it
  me.toolPos = {x: 0, y: 0, pos: []};
  me.overlap = [];
  me.remainCut = 0;

  me.isReady = false; // if the player is ready to start
  me.isPlaying = false; // if the player is playing
  me.enabled = false; // if the control is enabled

  // start playing the title music
  assets.get('title_music').loop();
}

function draw() {
  background('#201f20');

  sceneManager.gameUpdate();
}

// *** game state management ***
class SceneManager {
  static get(){
    if(!this.instance) this.instance = new SceneManager();
    return this.instance;
  }
  constructor() {
    // main grid settings
    this.grid = {x: Grid.x, y: Grid.y, inter: Grid.inter, row: Grid.row, col: Grid.col};
    // game canvas
    this.operateTable = new sprite(272, height + 20, 272, 140, 326, 340, assets.get('operating_panel'));
    this.targetCanvas = new sprite(-240, 140, 0, 140, 220, 260, assets.get('target_panel'));
    this.teamTools = [];
    this.toolMasks = [];
    this.targetCompCanvas = [];
    this.curCompCanvas = [];

    this.resultStamps = [];
    // alert text
    this.alertToggle = false;
    this.alertTimer = 0;
    
    this.backgroundImage = assets.get('background_image'); // background image
    this.titleImage = assets.get('title_image'); // title image (array)
    this.titleImageCount = 0;
    // tutorial button
    this.tutorialToggle = false; // if the tutorial is opened
    this.tutorialPage = 0; // which page of the tutorial is being read
    this.tutorialCanvas = createGraphics(526, 366); // tutorial canvas
    this.tutorialImages = [];
    this.tutorialTexts = tutorialTexts;
    this.tutorialButton = new cusButton(584, 432, 50, 44, function(){
      sceneManager.tutorialToggle = !sceneManager.tutorialToggle;
      sceneManager.backButton.enable();
      sceneManager.forthButton.enable();
      me.isReady = false; // cancell the ready state
    }, assets.get('button_tutorial'), {default: true});
    this.backButton = new cusButton(26, 302, 50, 44, function(){
      sceneManager.tutorialPage = max(sceneManager.tutorialPage - 1, 0);
    }, assets.get('button_back'), {offsetX: 60, offsetY: 60});
    this.forthButton = new cusButton(454, 302, 50, 44, function(){
      sceneManager.tutorialPage = min(sceneManager.tutorialPage + 1, tutorialTexts.length - 1);
    }, assets.get('button_forth'), {offsetX: 60, offsetY: 60});
    // sound play check
    this.soundCheck = [false, false, false]; // start, end, stamp over
  }
  // initialize canvas arries
  initializeCanvas() {
    let amount = shared.playerAmount;
    let interTools = 20, widthTools = 94, heightTools = 116, interResult = 30, sizeResult = 112;
    let originXResult = WIDTH/2 - (amount/2 * sizeResult + (amount/2 - 0.5) * interResult);
    for(let i = 0; i < amount; i++) {
      let xTools = WIDTH - 60 - (i + 1) * widthTools - i * interTools;
      // initialize tool panels
      this.teamTools.push(new sprite(xTools, -20-heightTools, xTools, 0, widthTools, heightTools, assets.get('tool_panel')));
      this.toolMasks.push(new dynamicImage(0, -20-widthTools, 0, -20-widthTools, assets.get('tool_panelMask')));
      let xResult = originXResult + i * (interResult + sizeResult);
      this.targetCompCanvas.push(new sprite(xResult, -20-sizeResult, xResult, 100, sizeResult, sizeResult, assets.get('result_panel')));
      this.curCompCanvas.push(new sprite(xResult, HEIGHT, xResult, 280, sizeResult, sizeResult, assets.get('result_panel')));
    }
  }
  // reset canvas arries
  resetCanvas() {
    this.operateTable.reset();
    this.targetCanvas.reset();
    this.teamTools = [];
    this.targetCompCanvas = [];
    this.curCompCanvas = [];
    this.resultStamps = [];
    this.tutorialPage = 0;
    this.soundCheck = [false, false, false];
    me.isReady = false;
  }
  // return all the canvas
  returnCanvas() {
    this.operateTable.return();
    this.targetCanvas.return();
    this.teamTools.forEach(can => can.return());
    this.targetCompCanvas.forEach(can => can.return());
    this.curCompCanvas.forEach(can => can.return());
  }
  // check if all the canvas are ready
  checkCanvasReady() {
    let readyCheck = true;
    for(var r of this.teamTools) if(!r.isReady) readyCheck = false;
    for(var r of this.targetCompCanvas) if(!r.isReady) readyCheck = false;
    for(var r of this.curCompCanvas) if(!r.isReady) readyCheck = false;
    return (this.operateTable.isReady && this.targetCanvas.isReady && readyCheck);
  }
  // check if the stamps are all ready
  checkStampReady() {
    let result = true;
    for(var s of this.resultStamps) if(!s.isReady) result = false;
    return result;
  }
  // update all the canvas
  updateCanvas() {
    this.operateTable.update();
    this.targetCanvas.update();
    this.teamTools.forEach(can => can.update());
    if(shared.gameState > 2) {
      this.targetCompCanvas.forEach(can => can.update());
      this.curCompCanvas.forEach(can => can.update());
    }
  }
  // show all the canvas
  showCanvas() {
    this.operateTable.show();
    this.targetCanvas.show();
    this.teamTools.forEach(can => can.show());
  }
  showUpCanvas() {
    this.targetCompCanvas.forEach(can => can.show());
    this.curCompCanvas.forEach(can => can.show());
  }
  showStamps() {
    for(let stp in this.resultStamps) {
      this.resultStamps[stp].update();
      this.resultStamps[stp].show(this.curCompCanvas[stp].canvas);
    }
  }

  // check if all the players are ready to play
  checkReady() {
    let result = true;
    for(var p of participants) if(!p.isReady) result = false;
    return result;
  }
  // attempt to trigger the button
  buttonTrigger() {
    this.tutorialButton.trigger();
    this.backButton.trigger();
    this.forthButton.trigger();
    return false;
  }
  // tutorial
  tutorialRender() {
    if(this.tutorialToggle) {
      let canvas = this.tutorialCanvas;
      canvas.push();
      canvas.image(assets.get('tutorial_panel'), 0, 0); // render the panel image
      // render the tutorial images
      canvas.stroke(255);
      canvas.strokeWeight(2);
      canvas.image(assets.get('tutorial_images')[this.tutorialPage], 83, 23, 360, 202);
      canvas.noStroke();
      // render the tutorial texts
      canvas.fill(255);
      canvas.rectMode(CENTER);
      canvas.textFont(txtFont);
      canvas.textSize(12);
      canvas.textWrap(WORD);
      canvas.textAlign(CENTER);
      canvas.textLeading(16);
      canvas.text(this.tutorialTexts[this.tutorialPage], canvas.width/2, 250, 472);
      // render the page
      canvas.textSize(16);
      canvas.text(this.tutorialPage + 1 + "/" + this.tutorialTexts.length, canvas.width/2, 330);
      // render back and forth buttons
      this.backButton.render(canvas);
      this.forthButton.render(canvas);
      canvas.pop();
      push();
      // show the dark background
      fill(0, 120);
      rect(0, 0, width, height);
      image(canvas, 60, 60);
      pop();
    }
  }
  // check what to present according to the current game state
  gameUpdate() {
    // always show the background images
    if(frameCount % 15 === 0) this.titleImageCount = (this.titleImageCount + 1) % (this.titleImage.length);
    push();
    image(this.backgroundImage, 0, 0);
    image(this.titleImage[this.titleImageCount], 0, 0);
    pop();

    if(shared.isRunning && me.isPlaying) { // if the game is running && player is playing
      // initialize the canvas and stop the title music
      if(this.teamTools.length < 1) {
        this.initializeCanvas();
        assets.get('title_music').stop();
        assets.get('gear_spin').play();
      }
      // update all the canvas
      this.updateCanvas();
      // draw game objects on the canvas
      // drawGrid(this.grid, this.operateTable.canvas); // draw the grid
      drawComponent(components.initComps[me.curCompId], this.grid, this.operateTable.canvas); // draw the current component
      if(me.enabled) drawTool(me, this.grid, this.operateTable.canvas); // draw the player's tool

      // draw the target component
      drawComponent(components.targetComps[me.curCompId], this.grid, this.targetCanvas.canvas,
        {scale: 0.8, size: 14, offsetX: 128, offsetY: 146, mode: 'target'});
      for(let t in shared.playerTools) { // draw team tools
        drawComponent(shared.playerTools[(me.curCompId + parseInt(t)) % shared.playerAmount], this.grid, this.teamTools[t].canvas,
        {scale: 0.6, size: 6, offsetX: 47, offsetY: 69});
        // update and draw the tool mask
        this.toolMasks[t].update(this.teamTools[t].canvas);
      }
      this.teamTools[0].canvas.image(assets.get("self_mark"), 0, 22); // draw player mark
      // show all the canvas
      this.showCanvas();
      // check the current game state
      let state = shared.gameState;
      if(state < 1) { // state 0: game start countdown
        showText(count.countdown, {x: WIDTH/2, y: 60}, 40, color(0), {col: color(255), weight: 2}); // show the game start countdown
        if(partyIsHost()) {
          if(frameCount % 60 === FRAME_count) count.countdown --; // game start countdown
          if(count.countdown <= 0) {
            for(var p of participants) p.enabled = true;
            count.countdown = countDownTime + (shared.playerAmount - shared.round) * 5;
            shared.round ++;
            shared.gameState ++;
          }
        }
      } else if(state === 1) { // state 1: game play
        if(partyIsHost()) { // the host will countdown and update round
          if(frameCount % 60 === FRAME_count && !shared.pauseToggle) count.countdown --; // game play countdown
          if(count.countdown <= 0) this.deliver(); // when countdown is over, deliver the component
        }
        showCountdown(128, 182, 28); // show countdown
        showText('Remaining Cut Chance: ' + me.remainCut, {x: 130, y: HEIGHT - 30}, 14, color(255)); // show remaining cut chance
        if(!this.soundCheck[0]) { // play the start bell
          assets.get('start_bell').play();
          assets.get('play_music').loop(); // start the playing music
          this.soundCheck[0] = true;
        }
      } else if(state > 2) {
        // show the dark background
        fill(0, 120);
        rect(0, 0, width, height);
        for(let tc in components.targetComps) {
          drawComponent(components.targetComps[tc], this.grid, this.targetCompCanvas[tc].canvas,
            {scale: 0.6, size: 8, offsetX: 56, offsetY: 56, mode: 'target'}); // draw the target result
        }
        for(let ac in components.initComps) {
          drawComponent(components.initComps[ac].comp, this.grid, this.curCompCanvas[ac].canvas,
            {scale: 0.6, size: 8, offsetX: 56, offsetY: 56}); // draw the actual result
        }
        if(state === 3) { // state 3: load component images
          if(partyIsHost() && this.checkCanvasReady()) shared.gameState ++;
          if(this.resultStamps.length < 1) { // initialize stamps
            for(let r in shared.gameResult) this.resultStamps.push(new spriteS(
              this.curCompCanvas[r].canvas.width/2, this.curCompCanvas[r].canvas.height/2, 3, shared.gameResult[r]
            ));
          }
          if(!this.soundCheck[1]) { // play the end bell
            assets.get('end_bell').play();
            assets.get('gear_spin').play();
            assets.get('play_music').stop(); // stop the playing music
            this.soundCheck[1] = true;
          }
        }
        if(state > 3) {
          this.showStamps(); // enable the stamps
          if(state === 4) { // state 4: load stamps
            if(partyIsHost() && this.checkStampReady()) shared.gameState ++;
          }
          if(state === 5) { // state 5: result page, waiting for restart
            if(partyIsHost()) {
              showBlinkText("Click the Screen to End", {x: width/2, y: height - 230}, 26, color(220));
            } else {
              showBlinkText("Wait for the the Host to End", {x: width/2, y: height - 230}, 26, color(220));
            }
            if(this.checkStampReady() && !this.soundCheck[2]) { // play the stamp sound
              assets.get('stamp').play();
              this.soundCheck[2] = true;
            }
          }
          if(state === 6) {
            if(partyIsHost() && this.checkCanvasReady()) {
              shared.isRunning = false;
              for(var p of participants) p.isPlaying = false;
            } else if(this.checkCanvasReady()) this.returnCanvas();
          }
        }
        // show the result canvas
        this.showUpCanvas();
      }
    } else if(shared.isRunning && !me.isPlaying){ // if the game is running && the player is not playing
      showText("MATRIX FACTORY", {x: width/2, y: 80}, 40, color(0), {col: color(255), weight: 4}); // show the title
      // "Please wait for next round"
      showText("Please wait for next round", {x: width/2, y: height - 230}, 26, color(220));
      // render the tutorial button
      this.tutorialRender();
      this.tutorialButton.render();
    } else { // if the game is not running
      showText("MATRIX FACTORY", {x: width/2, y: 80}, 40, color(0), {col: color(255), weight: 4}); // show the title
      // reset the canvas and replay the title music
      if(this.teamTools.length > 0) {
        this.resetCanvas();
        assets.get('title_music').loop();
      }
      // show the title scene
      if(partyIsHost()) {
        showBlinkText("Click the Screen to start", {x: width/2, y: height - 230}, 26, color(220));
      } else if(me.isReady){
        showBlinkText("Wait for the the Host to Start", {x: width/2, y: height - 230}, 26, color(80, 220, 80));
      } else showBlinkText("Click the Screen to get ready", {x: width/2, y: height - 230}, 26, color(220));
      // show the alert text
      if(this.alertToggle) showText("Someone is not ready", {x: width/2, y: height - 170}, 24, color(220, 80, 80));
      // render the tutorial button
      this.tutorialRender();
      this.tutorialButton.render();
    }
  }

  // start the game (global)
  startGame() {
    FRAME_count = frameCount % 60; // record current frameCount step
    // shuffle tools and components
    let usedTools = shuffle(toolType);
    let usedCompId = shuffle(compId);
    // reset target & init components
    components.initComps = [];
    components.targetComps = [];
    shared.playerTools = [];
    // reset the game result
    shared.gameResult = [];

    // reset players' states
    for(let p in participants) {
      participants[p].isPlaying = true;

      // distribute tools
      participants[p].tool = usedTools[p];
      shared.playerTools.push(participants[p].tool);
      participants[p].toolPos = {x: 0, y: 0, pos: []}; // reset posInfo of the tool
      initializeTool(participants[p]); // initialize the tool
      participants[p].remainCut = 3; // reset remain cut chance

      // distribute components
      components.initComps.push({comp: {}, posInfo: []});
      components.targetComps.push(targetType[usedCompId[p]]);
      components.initComps[p].comp = materialType[usedCompId[p]];

      initializeComponent(components.initComps[p]); // initialize the init components

      // distribute components to players
      participants[p].initCompId = parseInt(p); // *This might be a bug
      participants[p].curCompId = parseInt(p);
    }
    count.countdown = 3;

    shared.gameState = 0; // reset the game state
    shared.round = 0; // reset the round to 0
    shared.playerAmount = participants.length; // roecord player number of this round of play
    shared.isRunning = true; // game start running
  }
  // end the game (global)
  endGame() {
    // disable all the players
    for(var p of participants) p.enabled = false;
    // check the game result
    components.initComps.forEach(function(comp, i) {
      let targetShape = components.targetComps[i].shape;
      comp.comp = cutShapeBox(comp.posInfo);
      let curShape = comp.comp.shape;
      if(targetShape.length !== curShape.length || targetShape[0].length !== curShape[0].length) shared.gameResult.push(false);
      else if(checkOverlap(targetShape, curShape, false)) shared.gameResult.push(true);
      else shared.gameResult.push(false);
    });
    // update game state
    shared.gameState += 2;
  }
  // deliver the component to next player (global)
  deliver() {
    participants.forEach(function(player) {
      let newCompId = (player.curCompId + 1) % shared.playerAmount;
      if(newCompId !== player.curCompId) player.curCompId = newCompId;
    })
    if(me.curCompId == me.initCompId) { // if it's already the last round, end the game
      this.endGame();
    } else {
      for(var p of participants) {
        if(p.isPlaying) {
          p.enabled = true; // enable all the players
          p.remainCut = 3; // recharge remaining cut chance
        }
      }
      count.countdown = countDownTime + (shared.playerAmount - shared.round) * 5; // reset the countdown
      assets.get('gear_spin').play();
    }
    this.toolMasks[shared.playerAmount - shared.round].changeTarget(0, 22); // enable the tool panel mask
    shared.round ++;
  }
}

// *** player behavior ***
// watch player's input key
function mouseClicked() { // click the canvas to start game
  isMousePressed = true;
  if(!sceneManager.buttonTrigger() && !shared.isRunning && inCanvas(mouseX, mouseY) && !sceneManager.tutorialToggle) {
      if(partyIsHost()) {
        me.isReady = true; // make the host ready
        if(sceneManager.checkReady()) sceneManager.startGame();
        else {
          sceneManager.alertToggle = true;
          sceneManager.alertTimer = setTimeout(function() {
            sceneManager.alertToggle = false;
            clearTimeout(sceneManager.alertTimer);
          }, 1500);
        }
        assets.get('button_click1').play(); // play the click sound
      }
      else if(!sceneManager.buttonTrigger() && !me.isPlaying && !sceneManager.tutorialToggle) {
        me.isReady = !me.isReady;
        assets.get('button_click2').play(); // play the click sound
      }
  } else {
    if(shared.gameState === 5) { // back to title scene
      if(partyIsHost()) {
        sceneManager.returnCanvas();
        shared.gameState ++;
        assets.get('button_click2').play(); // play the sound
      }
    }
  }
}
function mouseReleased() {
  isMousePressed = false;
}
function keyPressed() {
  if(me.enabled) {
    let command = '';
    if(keyCode === ENTER && !keyCooldown) { // press ENTER to process the component
      process(components.initComps[me.curCompId].posInfo, me);
      keyCooldown = true; // key cooldown is used to prevent inadvertently hit
      cooldownTimer = setTimeout(function() {
        keyCooldown = false;
        clearTimeout(cooldownTimer);
      }, 300);
    } else { // press w, a, s, d or Up, Left, Down, Right to move the tool 
      switch(keyCode) {
        case 65:
        case 37:
          command = 'LEFT';
          break;
        case 68:
        case 39:
          command = 'RIGHT';
          break;
        case 87:
        case 38:
          command = 'UP';
          break;
        case 83:
        case 40:
          command = 'DOWN';
          break;
        default:
          command = 'null';
      }
      // *This is a developer feature which should be removed in published version*
      if(keyCode === 50) shared.pauseToggle = !shared.pauseToggle;
      else if(keyCode === SHIFT) count.countdown += 15;
    }
    updateTool(me, command); // update the position of the tool
  }
  if(keyCode === 49) saveCanvas('ScreenShot');
}

// *** game objects manipulation ***
function initializeComponent(component) {
  let row = Grid.row, col = Grid.col, comp = component.comp;
  let x = floor((col - comp.width) / 2), y = floor((row - comp.height) / 2);
  for(let r = 0; r < row; r ++) {
    let newrow = [];
    for(let c = 0; c < col; c ++) {
      if(r >= y && r < y + comp.height && c >= x && c < x + comp.width) newrow.push(comp.shape[r - y][c - x]);
      else newrow.push(0);
    }
    component.posInfo.push(newrow);
  }
}

// initialize the position of the tool on the grid
function initializeTool(player) {
  let row = Grid.row, col = Grid.col, tool = player.tool;
  for(let r = 0; r < row; r ++) {
    let newrow = [];
    for(let c = 0; c < col; c ++) {
      if(r < tool.height && c < tool.width) newrow.push(tool.shape[r][c]);
      else newrow.push(0);
    }
    player.toolPos.pos.push(newrow);
  }
}

// update the position of the tool on the grid
function updateTool(player, command) {
  let posInfo = player.toolPos.pos;
  let posInfo_copy = deepCopy(posInfo), r = Grid.row, c = Grid.col;
  let x = player.toolPos.x, y = player.toolPos.y, w = player.tool.width, h = player.tool.height;
  // check the command and if the tool hasn't collide the edge of the grid
  // update grid information
  switch(command) {
    case 'LEFT':
      if(x > 0) {
        for(let i = 0; i < r; i ++) {
          for(let j = 0; j < c; j ++) {
            if(posInfo_copy[i][j]) {
              posInfo[i][j] = 0;
              posInfo[i][j - 1] = 1;
      }}}
        player.toolPos.x --;
      }
      break;
    case 'RIGHT':
      if(x + w < c) {
        for(let i = 0; i < r; i ++) {
          for(let j = c - 1; j >= 0; j --) {
            if(posInfo_copy[i][j]) {
              posInfo[i][j] = 0;
              posInfo[i][j + 1] = 1;
      }}}
        player.toolPos.x ++;
      }
      break;
    case 'UP':
      if(y > 0) {
        for(let i = 0; i < r; i ++) {
          for(let j = 0; j < c; j ++) {
            if(posInfo_copy[i][j]) {
              posInfo[i][j] = 0;
              posInfo[i - 1][j] = 1;
      }}}
        player.toolPos.y --;
      }
      break;
    case 'DOWN':
      if(y + h < r) {
        for(let i = r - 1; i >= 0; i --) {
          for(let j = 0; j < c; j ++) {
            if(posInfo_copy[i][j]) {
              posInfo[i][j] = 0;
              posInfo[i + 1][j] = 1;
      }}}
        player.toolPos.y ++;
      }
      break;
    default:
  }
  // check if the tool overlap the component
  player.overlap = checkOverlap(player.toolPos.pos, components.initComps[player.curCompId].posInfo);
}
// process the current component
function process(compInfo, player) {
  let toolPos = player.toolPos.pos;
  if(player.overlap.length > 0) { // if there are overlaps, cut the component
    player.overlap.forEach(o => compInfo[o.y][o.x] = 0);
    player.remainCut --; // reduce remaining cut chance by 1
    if(player.remainCut < 1) player.enabled = false; // if remain cut chance is used up, disable the player
    assets.get('metal_cut').play(); // play the cut sound
  } else { // if no overlap, add the tool to the component, then disable the player
    for(let row in compInfo) {
      for(let col in compInfo) {
        if(toolPos[row][col]) compInfo[row][col] = 1;
      }
    }
    player.enabled = false;
    assets.get('metal_broken').play(); // play the broken sound
  }
}

// *** visual functions ***

function drawGrid(grid, canvas = window) {
  canvas.fill(120);
  let x = grid.x, y = grid.y, row = grid.row, col = grid.col, inter = grid.inter;
  for(let r = 0; r < row; r ++) {
    for(let c = 0; c < col; c ++) {
      canvas.circle(x + r * inter, y + c * inter, 30);
    }
  }
}
// draw the component on the grid(or singularly on a sprite canvas)
function drawComponent(component, grid, canvas = window, option = false) { // option - {scale, size, offsetX, offsetY}
  canvas.push();
  canvas.imageMode(CENTER);
  if(!option) {
    let x = grid.x, y = grid.y, row = grid.row, col = grid.col, inter = grid.inter;
    let posInfo = component.posInfo;
    for(let r = 0; r < row; r ++) {
      for(let c = 0; c < col; c ++) {
        if(posInfo[r][c]) canvas.image(assets.get('single_parts')[0], x + c * inter, y + r * inter);
      }
    }
  } else {
    let row = component.height, col = component.width, inter = option.scale * Grid.inter;
    let x = option.offsetX - (col/2 - 0.5) * inter, y = option.offsetY - (row/2 - 0.5) * inter;
    for(let r = 0; r < row; r ++) {
      for(let c = 0; c < col; c ++) {
        if(component.shape[r][c]) {
          if(option.mode === 'target')
            canvas.image(assets.get('single_parts')[2], x + c * inter, y + r * inter, option.scale * singlePartSize, option.scale * singlePartSize);
          else
            canvas.image(assets.get('single_parts')[0], x + c * inter, y + r * inter, option.scale * singlePartSize, option.scale * singlePartSize);
        }
      }
    }
  }
  canvas.pop();
}
// draw the tool on the grid
function drawTool(player, grid, canvas = window) {
  canvas.imageMode(CENTER);
  let height = player.tool.height, width = player.tool.width, shape = player.tool.shape;
  let inter = grid.inter;
  let x = grid.x + player.toolPos.x * inter, y = grid.y + player.toolPos.y * inter;
  for(let r = 0; r < height; r ++) {
    for(let c = 0; c < width; c ++) {
      if(shape[r][c]) canvas.image(assets.get('single_parts')[1], x + c * inter, y + r * inter);
    }
  }
  // draw the mark
  if(player.overlap.length > 0) player.overlap.forEach(o => drawMark(o, sceneManager.grid, canvas)); 
}
// draw a single mark on the Grid
function drawMark(pos, grid, canvas = window) {
  canvas.imageMode(CENTER);
  let ox = grid.x, oy = grid.y, inter = grid.inter;
  canvas.image(assets.get('overlap_mark'), ox + pos.x * inter, oy + pos.y * inter);
}

// *** auxiliar functions ***

// deepcopy a 2 dimensional array
function deepCopy(obj) {
  var out = [], i = 0, len = obj.length;
  for(; i < len; i++) {
    if (obj[i] instanceof Array){
        out[i] = deepCopy(obj[i]);
    } else out[i] = obj[i];
  }
  return out;
}

// check if 2 matrixes are overlapping; if overlapped, return the overlap position
function checkOverlap(matrix1, matrix2, mode = true) { // mode: true - return position; false - return if complete overlap
  let overlap = [], difference = false;
  // length and dimension of the 2 matrixes must be equal
  for(let row in matrix1) {
    for(let col in matrix1[row]) {
      if(matrix1[row][col] && matrix2[row][col]) overlap.push({x: col, y: row});
      if(matrix1[row][col] !== matrix2[row][col]) difference = true;
    }
  }
  if(mode) return overlap;
  else return !difference;
}
// cut out the shape box from the whole grid
function cutShapeBox(gridInfo) {
  // check from 4 directions
  let posX = [], posY = [], box = [];
  for(let row in gridInfo) {
    for(let col in gridInfo) {
      if(gridInfo[row][col]) {
        posX.push(col);
        posY.push(row);
      }
    }
  }
  let left = min(posX), right = max(posX), top = min(posY), btm = max(posY);
  for(let row = top; row <= btm; row ++) {
    let newrow = [];
    for(let col = left; col <= right; col ++) newrow.push(gridInfo[row][col]);
    box.push(newrow);
  } // return the entire component
  return {width: right - left + 1, height: btm - top + 1, shape: box};
}

// check if a point is inside a canvas
function inCanvas(x, y, canvas = window) {
  if(x >= 100 && x < canvas.width - 100 && y >= 100 && y < canvas.height - 100) return true
  else return false;
}
// sum of an array
function sumup(arr) {
  let sum = 0;
  arr.forEach(i => sum += i);
  return sum;
}
// show text
function showText(txt, pos, size, col, options = null, canvas = window) {
  canvas.push();
  if(options) {
    canvas.stroke(options.col);
    canvas.strokeWeight(options.weight);
  } else canvas.noStroke();
  canvas.textSize(size);
  canvas.textAlign(CENTER);
  canvas.fill(col);
  canvas.text(txt, pos.x, pos.y);
  canvas.pop();
}
function showBlinkText(txt, pos, size, col, canvas = window) {
  canvas.push();
  canvas.textSize(size);
  canvas.textAlign(CENTER);
  canvas.fill(col);
  if(frameCount % 120 < 60) {
    canvas.text(txt, pos.x, pos.y);
  }
  canvas.pop();
}
// show the countdown
function showCountdown(x = width/2, y = 60, size = 32) {
  let num = count.countdown;
  push();
  // textFont(_numFont);
  if(num > 3) fill(255);
  else fill(220, 0, 0);
  textSize(size);
  textAlign(CENTER);
  text(num, x, y);
  pop();
}

// *** customized sprite ***
class sprite {
  constructor(x, y, tx, ty, w, h, img = null, rate = 30) {
    this.opos_x = x; // initial x position
    this.opos_y = y; // initial y position
    this.pos_x = x; // current x position
    this.pos_y = y; // current x position
    this.otargt_x = tx; // initial target x position
    this.otargt_y = ty; // initial target y position
    this.targt_x = tx; // target x position
    this.targt_y = ty; // target y position
    this.canvas = createGraphics(w, h);

    this.img = img; // image sequence
    this.rate = rate; // bigger to slower the moving spd
    this.isReady = false; // inform if the sprite has reach the right position
  }
  // reset the position of the sprite
  reset(){
    this.pos_x = this.opos_x;
    this.pos_y = this.opos_y;
    this.targt_x = this.otargt_x;
    this.targt_y = this.otargt_y;
  }
  return() {
    this.targt_x = this.opos_x;
    this.targt_y = this.opos_y;
  }

  update(canvas = window){
    let x = this.pos_x, y = this.pos_y, v = this.rate;
    let tx = this.targt_x, ty = this.targt_y;
    // if the current postion does not match the target position, move the sprite
    if(x !== tx || y !== ty){
      this.isReady = false;
      this.pos_x += (tx - x) / v;
      this.pos_y += (ty - y) / v;
      // if the current position get close enough to the target, stop moving
      if(abs(this.pos_x - tx) < 1) this.pos_x = tx;
      if(abs(this.pos_y - ty) < 1) this.pos_y = ty;
    } else this.isReady = true;
    this.draw(canvas);
  }
  // change the target position of the sprite
  changeTarget(x, y){
    this.targt_x = x;
    this.targt_y = y;
  }
  // draw the image on the canvas
  draw(canv) {
    let canvas = this.canvas;
    canvas.push();
    canvas.fill(180);
    canvas.imageMode(CORNER);
    canvas.textAlign(CENTER);
    if(this.img) {
      if(typeof this.img == String) canvas.text(this.image);
      else canvas.image(this.img, 0, 0);
    } else canvas.rect(0, 0, this.canvas.width, this.canvas.height);
    canvas.pop();
  }
  show() {
    let x = this.pos_x, y = this.pos_y;
    image(this.canvas, x, y);
  }
}
class spriteS {
  constructor(x, y, scale, mode, rate = 0.04) {
    this.pos_x = x; // current x position
    this.pos_y = y; // current x position
    this.init_scale = scale; // initial scale of the sprite
    this.cur_scale = scale; // current scale of the sprite
    this.targt_scale = 1; // target scale of the sprite

    this.mode = mode;
    this.rate = rate; // bigger to slower the moving spd
    this.isReady = false; // inform if the sprite has reach the right position
  }
  // reset the position of the sprite
  reset(){
    this.cur_scale = this.init_scale;
  }
  return() {
    this.targt_scale = this.init_scale;
  }

  update(){
    let cs = this.cur_scale, ts = this.targt_scale;
    // if the current scale does not match the target scale, scale the sprite
    if(cs >= ts){
      this.isReady = false;
      this.cur_scale -= this.rate;
    } else this.isReady = true;
  }
  // change the target scale value of the sprite
  changeTarget(s){
    this.targt_scale = s;
  }
  show(canvas = window) {
    let x = this.pos_x, y = this.pos_y, cs = this.cur_scale;
    canvas.push();
    canvas.imageMode(CENTER);
    if(this.mode) canvas.image(assets.get('stamps')[1], x, y, 116 * cs, 116 * cs);
    else canvas.image(assets.get('stamps')[0], x, y, 116 * cs, 116 * cs);
    canvas.pop();
  }
}
class dynamicImage extends sprite{
  constructor(x, y, tx, ty, img = null, rate = 30) {
    super(x, y, tx, ty, 0, 0, img, rate);
    this.isReady = false; // inform if the sprite has reach the right position
  }
  draw(canvas) {
    let x = this.pos_x, y = this.pos_y;
    canvas.push();
    canvas.imageMode(CORNER);
    canvas.image(this.img, x, y);
    canvas.pop();
  }
}
// *** customized button ***
class cusButton { // (x position, y position, width, height, event listener, button images, text, text color, text size)
  constructor(x, y, width, height, func, imgs = [], option = {}){
    this.pos_x = x;
    this.pos_y = y;
    this.offset_x = option.offsetX || 0; // offset used to output the absolute coordination of the button
    this.offset_y = option.offsetY || 0;
    this.width = width;
    this.height = height;
    
    this.func = func; // event listener on the button
    this.imgs = imgs; // [0]: normal; [1]: clicked
    this.text = option.text || '';
    this.text_color = option.text_col || 255;
    this.text_size = option.text_size || 22;
    this.enabled = option.default || false; // if the button is enabled
    // this.pressed = false;
  }

  // enable or disable
  enable(){
    this.enabled = !this.enabled;
  }

  // check if the mouse is on the button
  ifMouseOn(){
    let x = this.pos_x + this.offset_x, y = this.pos_y + this.offset_y, w = this.width, h = this.height;
    let mx = mouseX, my = mouseY;
    if(mx > x + w || mx < x || my > y + h || my < y)
      return false;
    else return true;
  }

  // trigger the button
  trigger(){
    if(this.enabled && this.ifMouseOn()) {
      // if(!this.pressed) this.pressed = true;
      // else this.pressed = false;
      assets.get('button_click2').play(); // play the button clicked sound
      this.func();
    }
  }

  render(canvas = window){
    let x = this.pos_x, y = this.pos_y, w = this.width, h = this.height;

    canvas.push();
    canvas.imageMode(CORNER);
    canvas.textFont(textFont);
    canvas.textAlign(CENTER);
    canvas.textSize(this.text_size);
    canvas.fill(this.text_color);
    if(!this.pressed){
      canvas.image(this.imgs[0], x, y);
      canvas.text(this.text, x + w/2, y + h/2 + 8);
    }else{
      canvas.image(this.imgs[1], x + 2, y + 2);
      canvas.text(this.text, x + w/2, y + h/2 + 10);
    }
    canvas.pop();
  }
}
