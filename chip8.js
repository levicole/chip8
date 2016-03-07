var Chip8 = function(){
  MAPPING = {
      "1": 0x1,
      "2": 0x2,
      "3": 0x3,
      "4": 0xC,
      "Q": 0x4,
      "W": 0x5,
      "E": 0x6,
      "R": 0xD,
      "A": 0x7,
      "S": 0x8,
      "D": 0x9,
      "F": 0xE,
      "Z": 0xA,
      "X": 0x0,
      "C": 0xB,
      "V": 0xF
    }

  var loop,
      self = this,
      cpu = new CPU(),
      screen = new Screen("screen", 6),
      romSelector = document.getElementById("romSelector");

  this.cpu = cpu;
  this.loadRom = function(romName) {
    var self = this;
    var xhr = new XMLHttpRequest();
    var path = "roms/" + romName;
    xhr.open("GET", path, true);
    xhr.responseType = "arraybuffer";

    xhr.onload = function(e) {
      var rom = new Uint8Array(this.response);
      cpu.screen = screen;
      cpu.reset();
      cpu.loadRom(rom)
      self.start();
    }
    xhr.send();
  }

  this.romify = function(){
    var roms = [
      "PUZZLE", "BLINKY", "BLITZ", "BRIX",
      "CONNECT4", "GUESS", "HIDDEN", "INVADERS",
      "KALEID", "MAZE", "MERLIN", "MISSILE",
      "PONG", "PONG2", "PUZZLE", "SYZYGY",
      "TANK", "TETRIS", "TICTAC", "UFO",
      "VBRIX", "VERS", "WIPEOFF"];

    for(var i = 0; i < roms.length; i++){
      var rom = document.createElement("option");
      rom.value = roms[i];
      rom.appendChild(document.createTextNode(roms[i]));
      romSelector.appendChild(rom);
    }
  }

  var step = function(){
    cpu.cycle();
    loop = requestAnimationFrame(step);
  }

  this.start = function(){
    loop = requestAnimationFrame(step);
  }

  this.stop = function(){
    cancelAnimationFrame(loop);
  }

  this.pause = function(){
    cpu.paused = true;
  }


  window.addEventListener("keydown", function(event){
    var key  = String.fromCharCode(event.which),
        code = MAPPING[key];
    cpu.keys[code] = true;
    cpu.keyWasPressed = true;
  });

  window.addEventListener("keyup", function(event){
    var key  = String.fromCharCode(event.which),
        code = MAPPING[key];

    cpu.keys[code] = false;
  });

  romSelector.addEventListener("change", function(e){
    self.loadRom(romSelector.value);
    romSelector.blur();
    document.body.focus();
  });
}

var Screen = function(canvasId, scale){
  var canvas = document.getElementById(canvasId);

  canvas.width  = 64 * scale;
  canvas.height = 32 * scale;

  this.ctx = canvas.getContext("2d");
  this.bitmap    = new Array(32 * 64)
  this.scale = scale;

  this.clearScreen = function(){
    for(var i = 0; i < this.bitmap.length; i++) {
      this.bitmap[i] = 0;
    }
    this.ctx.fillStyle = "#000";
    this.ctx.fillRect(0,0, 64*this.scale, 32*this.scale);
  }

  this.render = function(){
    this.ctx.fillStyle = "#000";
    this.ctx.fillRect(0,0, 64*this.scale, 32*this.scale);
    this.ctx.fillStyle = "#FFF";
    for (var y = 0; y < 32; y++) {
      for (var x = 0; x < 64; x++) {
        if(this.bitmap[(y * 64) + x] == 1) {
          this.ctx.fillRect(x*this.scale,y*this.scale,this.scale,this.scale);
        }
      }
    }
  }
}


var ch8 = new Chip8();
document.addEventListener("DOMContentLoaded", function(){
  ch8.romify();
});
