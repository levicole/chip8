var Chip8 = function(){
  var loop,
      cpu = new CPU(),
      screen = new Screen("screen", 6);

  this.cpu = cpu;
  this.loadRom = function(path) {
    var self = this;
    var xhr = new XMLHttpRequest();
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

var ch8;
document.addEventListener("DOMContentLoaded", function(){
  ch8 = new Chip8();
  ch8.loadRom("/roms/UFO");
});
