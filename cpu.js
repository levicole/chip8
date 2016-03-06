var CPU = function() {
  this.pc     = 0x200;
  this.stack  = new Array;
  this.memory = new Uint8Array(4096);
  this.v      = new Uint8Array(16);
  this.i      = 0;
  this.dt     = 0;
  this.st     = 0;
  this.keys = {
    0x1: 0,
    0x2: 0,
    0x3: 0,
    0xC: 0,
    0x4: 0,
    0x5: 0,
    0x6: 0,
    0xD: 0,
    0x7: 0,
    0x8: 0,
    0x9: 0,
    0xE: 0,
    0xA: 0,
    0x0: 0,
    0xB: 0,
    0xF: 0
  }

  this.screen = {clearScreen: function(){}}

  this.reset = function() {
    this.pc = 0x200;
    this.stack = [];
    this.memory.fill(0);
    this.v.fill(0);
    this.i      = 0;
    this.dt     = 0;
    this.st     = 0;
    this.loadFont();
    this.screen.clearScreen();
  }


  this.loadFont = function(){
    var fontSet = Uint8Array.from([
      0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
      0x20, 0x60, 0x20, 0x20, 0x70, // 1
      0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
      0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
      0x90, 0x90, 0xF0, 0x10, 0x10, // 4
      0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
      0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
      0xF0, 0x10, 0x20, 0x40, 0x40, // 7
      0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
      0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
      0xF0, 0x90, 0xF0, 0x90, 0x90, // A
      0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
      0xF0, 0x80, 0x80, 0x80, 0xF0, // C
      0xE0, 0x90, 0x90, 0x90, 0xE0, // D
      0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
      0xF0, 0x80, 0xF0, 0x80, 0x80  // F
    ]);

    for(var i = 0; i < fontSet.length; i++){
      this.memory[i] = fontSet[i];
    }
  }

  this.perform = function(opcode){
    this.instructions[(opcode & 0xF000) >> 12].call(this, opcode);
  }

  this.cycle = function(){
    // for(var i = 0; i <= 5; i++){
      var opcode = (this.memory[this.pc] << 8) | this.memory[this.pc + 1];
      this.perform(opcode);
    // }

    if(this.dt > 0) this.dt -= 1;
    if(this.st > 0) this.st -= 1;

    if(this.drawFlag) {
      this.screen.render();
    }
  }

  this.NO_OP = function(opcode){
    console.log("No instruction for 0x" + hexToDecimal(opcode));
  }
  // 0x00E0 - Clears screen
  this.CLS = function(opcode){
    this.screen.clearScreen();
    this.drawFlag = true;
    this.pc += 2;
  }

  // 0x00EE - Return from Sub routine
  this.RET = function(opcode){
    this.pc = this.stack.pop();
    this.pc += 2;
  }

  // handles clr and return instructions...
  this.cls_ret = function(opcode){
    if((opcode & 0x000F) == 0x0000){
      this.CLS(opcode);
    } else if ((opcode & 0x000F) == 0x000E) {
      this.RET(opcode);
    } else {
      this.NO_OP(opcode);
    }
  }

  // 0x1NNN - jump to address NNN
  this.JP = function(opcode){
    this.pc = opcode & 0x0FFF;
  }

  // 0x2NNN - call sub routine at NNN
  this.CALL = function(opcode) {
    this.stack.push(this.pc);
    this.pc = opcode & 0x0FFF;
  }

  // 0x3XNN - skip next instruction if VX == NN
  this.SE_xnn = function(opcode) {
    if(this.v[(opcode & 0x0F00) >> 8] == (opcode & 0x00FF)) {
      this.pc += 4;
    } else {
      this.pc += 2;
    }
  }

  // 0x4XNN - skip next instruction if VX != NN
  this.SNE_nn = function(opcode) {
    if(this.v[(opcode & 0x0F00) >> 8] != (opcode & 0x00FF)) {
      this.pc += 4;
    } else {
      this.pc += 2;
    }
  }

  // 0x5XY0 - skip the next instruction if VX == VY
  this.SE_vx_vy = function(opcode) {
    if(this.v[(opcode & 0x0F00) >> 8] == this.v[(opcode & 0x00F0) >> 4]) {
      this.pc += 4;
    } else {
      this.pc += 2;
    }
  }

  // 0x6XNN load NN into register X
  this.LD_xnn = function(opcode) {
    this.v[(opcode & 0x0F00) >> 8] = opcode & 0x00FF;
    this.pc += 2;
  }

  // 0x7XNN add NN to what is in register X
  this.ADD_xnn = function(opcode) {
    this.v[(opcode & 0x0F00) >> 8] += opcode & 0x00FF;
    this.pc += 2;
  }

  // 0x8XY0 store the value in VY into VX
  this.LD_vx_vy = function(opcode){
    this.v[(opcode & 0x0F00) >> 8] = this.v[(opcode & 0x00F0) >> 4];
    this.pc += 2;
  }

  // 0x8XY1 set the value of VX to VX OR VY
  this.OR_vx_vy = function(opcode){
    this.v[(opcode & 0x0F00) >> 8] |= this.v[(opcode & 0x00F0) >> 4];
    this.pc += 2;
  }

  // 0x8XY2 set the value of VX to VX AND VY
  this.AND_vx_vy = function(opcode){
    this.v[(opcode & 0x0F00) >> 8] &= this.v[(opcode & 0x00F0) >> 4];
    this.pc += 2;
  }

  // 0x8XY3 set the value of VX to VX XOR VY
  this.XOR_vx_vy = function(opcode){
    this.v[(opcode & 0x0F00) >> 8] ^= this.v[(opcode & 0x00F0) >> 4];
    this.pc += 2;
  }

  // 0x8XY4
  this.ADD_vx_vy = function(opcode){
    if((this.v[(opcode & 0x0F00) >> 8] + this.v[(opcode & 0x00F0) >> 4]) > 0xFF) {
      this.v[0xF] = 1;
    } else {
      this.v[0xF] = 0;
    }
    this.v[(opcode & 0x0F00) >> 8] += this.v[(opcode & 0x00F0) >> 4];
    this.pc += 2;
  }

  // 0x8XY5
  this.SUB_vx_vy = function(opcode){
    if(this.v[(opcode & 0x0F00) >> 8] > this.v[(opcode & 0x00F0) >> 4]) {
      this.v[0xF] = 1;
    } else {
      this.v[0xF] = 0;
    }
    this.v[(opcode & 0x0F00) >> 8] -= this.v[(opcode & 0x00F0) >> 4];
    this.pc += 2;
  }

  //0x8XY6
  this.SHR_vx = function(opcode){
    this.v[0xF] = this.v[(opcode & 0x0F00) >> 8] & 0x1;
    this.v[(opcode & 0x0F00) >> 8] >>= 1;
    this.pc += 2;
  }

  //0x8XY7
  this.SUB_vy_vx = function(opcode){
    if(this.v[(opcode & 0x00F0) >> 4] > this.v[(opcode & 0x0F00) >> 8]) {
      this.v[0xF] = 1;
    } else {
      this.v[0xF] = 0;
    }
    this.v[(opcode & 0x0F00) >> 8] = this.v[(opcode & 0x00F0) >> 4] - this.v[(opcode & 0x0F00) >> 8];
    this.pc += 2;
  }

  //0x8XYE
  this.SHL_vx = function(opcode){
    this.v[0xF] = this.v[(opcode & 0x0F00) >> 8] >> 7;
    this.v[(opcode & 0x0F00) >> 8] <<= 1;
    this.pc += 2;
  }

  this.arithmetic = function(opcode){
    [
      this.LD_vx_vy,
      this.OR_vx_vy,
      this.AND_vx_vy,
      this.XOR_vx_vy,
      this.ADD_vx_vy,
      this.SUB_vx_vy,
      this.SHR_vx,
      this.SUB_vy_vx,
      this.NO_OP,
      this.NO_OP,
      this.NO_OP,
      this.NO_OP,
      this.NO_OP,
      this.NO_OP,
      this.SHL_vx
    ][(opcode & 0x000F)].call(this, opcode);
  }

  //0x9XY0 Skip next instruction if VX != VY
  this.SNE_vx_vy = function(opcode){
    if(this.v[(opcode & 0x0F00) >> 8] != this.v[(opcode & 0x00F0) >> 4]) {
      this.pc += 4;
    } else {
      this.pc += 2;
    }
  }

  //0xANNN the value of register I is set to NNN
  this.LD_I = function(opcode){
    this.i = opcode & 0x0FFF;
    this.pc += 2;
  }

  //0xBnnn jump to NNN + V0
  this.JP_VO = function(opcode){
    this.pc = (opcode & 0x0FFF) + this.v[0];
  }

  //0xCXNN set VX to random byte AND NN
  this.RND = function(opcode) {
    this.v[(opcode & 0x0F00) >> 8] = (Math.random() * 0xFF) & (opcode & 0x00ff);
    this.pc += 2;
  }

  // 0xD000 draw sprite
  this.DRW = function(opcode){
      var x = this.v[(opcode & 0x0f00) >> 8],
          y = this.v[(opcode & 0x00f0) >> 4],
          height = opcode & 0x000F,
          pixel;
      this.v[0xF] = 0;
      for(var yline = 0; yline < height; yline++) {
        pixel = this.memory[this.i + yline];
        for(var xline = 0; xline < 8; xline++) {
          if((pixel & (0x80 >> xline)) != 0) {
            if(this.screen.bitmap[(x + xline) + ((y + yline) * 64)] == 1) {
              this.v[0xF] = 1;
            }
            this.screen.bitmap[(x + xline) + ((y + yline) * 64)] ^= 1;
          }
        }
      }
      this.drawFlag = true
      this.pc += 2;
  }

  // 0xEx9E - skip the next opcode if the key in Vx isn't pressed
  this.SKP = function(opcode){
    var key = this.v[(opcode & 0x0F00) >> 8];
    if(this.keys[key] !== 0){
      this.pc += 4;
    } else {
      this.pc += 2;
    }
  }

  // 0xExA1 - skip the next opcode if the key in Vx is pressed
  this.SKNP = function(opcode){
    var key = this.v[(opcode & 0x0F00) >> 8];
    if(this.keys[key] === 0){
      this.pc += 4;
    } else {
      this.pc += 2;
    }
  }

  this.input = function(opcode){
    if((opcode & 0x00FF) == 0x9E) {
      return this.SKP(opcode);
    } else if ((opcode & 0x00FF) == 0xA1){
      this.SKNP(opcode);
    } else {
      this.NO_OP(opcode);
    }
  }

  // Fx07 - LD Vx, DT
  this.LD_vx_dt = function(opcode){
    console.log("vx dt")
    this.v[(opcode & 0x0F000) >> 8] = this.dt;
    this.pc += 2;
  }

  // Fx0A - LD Vx, K
  this.LD_vx_k = function(opcode){
    var key = this.v[(opcode & 0x0F00) >> 8];
    if(this.keys[key] == 1) {
      this.pc += 2;
    }
  }

  // Fx15 - LD DT, Vx
  this.LD_dt_vx = function(opcode){
    console.log("dt vx")
    this.dt = this.v[(opcode & 0x0F00) >> 8];
    this.pc += 2;
  }

  // Fx18 - LD ST, Vx
  this.LD_st_vx = function(opcode){
    this.st = this.v[(opcode & 0x0F00) >> 8];
    this.pc += 2;
  }

  // Fx1E - ADD I, Vx
  this.ADD_I_vx = function(opcode){
    this.i += this.v[(opcode & 0x0F00) >> 8];
    this.pc += 2;
  }
  // Fx29 - LD F, Vx
  this.LD_f_vx = function(opcode){
    this.i = this.v[(opcode & 0x0F00) >> 8] * 0x05;
    this.pc += 2;
  }
  // Fx33 - LD B, Vx
  this.LD_b_vx = function(opcode){
    this.memory[this.i]     = parseInt(this.v[(opcode & 0x0F00) >> 8] / 100);
    this.memory[this.i + 1] = parseInt((this.v[(opcode & 0x0F00) >> 8] / 10) % 10);
    this.memory[this.i + 2] = (this.v[(opcode & 0x0F00) >> 8] % 100) % 10;
    this.pc += 2;
  }
  // Fx55 - LD [I], Vx
  this.LD_i_vx = function(opcode){
    for(var i = 0; i <= ((opcode & 0x0F00) >> 8); i++){
      this.memory[this.i + i] = this.v[i];
    }
    this.index += ((opcode & 0x0F00) >> 8) + 1;
    this.pc += 2;
  }
  // Fx65 - LD Vx, [I]
  this.LD_vx_i = function(opcode){
    for(var i = 0; i <= ((opcode & 0x0F00) >> 8); i++){
      this.v[i] = this.memory[this.i + i];
    }
    this.index += ((opcode & 0x0F00) >> 8) + 1;
    this.pc += 2
  }

  this.loads = function(opcode){
    switch(opcode & 0x00FF) {
    case 0x07:
      this.LD_vx_dt(opcode);
      break;
    case 0x0A:
      this.LD_vx_k(opcode);
      break;
    case 0x15:
      this.LD_dt_vx(opcode);
      break;
    case 0x18:
      this.LD_st_vx(opcode);
      break;
    case 0x1E:
      this.ADD_I_vx(opcode);
      break;
    case 0x29:
      this.LD_f_vx(opcode);
      break;
    case 0x33:
      this.LD_b_vx(opcode);
      break;
    case 0x55:
      this.LD_i_vx(opcode);
      break;
    case 0x65:
      this.LD_vx_i(opcode);
      break;
    }
  }

  this.instructions = [
    this.cls_ret, this.JP, this.CALL, this.SE_xnn,
    this.SNE_nn, this.SE_vx_vy, this.LD_xnn, this.ADD_xnn,
    this.arithmetic, this.SNE_vx_vy, this.LD_I, this.JP_VO,
    this.RND, this.DRW, this.input, this.loads
  ]

  this.loadRom = function(rom) {
    this.memory.set(rom, 0x200)
  }
}

function hexToDecimal(num) {
  var str = num.toString(16);
  if(str.length < 4) {
    var padding = "0".repeat((4 - str.length));
    str = padding + str;
  }
  return str;
}
