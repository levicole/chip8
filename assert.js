var assert = function(expected, actual){
  if(expected != actual){
    console.error(arguments.callee.caller.caller.arguments[0] + " Expected " + expected + " but got " + actual + ":");
  }
}

var test = function(desc, callback){
  callback();
}

var cpu = new CPU();

test("test RET instruction", function(){
  cpu.stack.push(0x200);
  cpu.pc = 0x222;
  cpu.perform(0x00EE);
  assert(cpu.pc, 0x200 + 2)
});

test("test JMP instruction", function(){
  cpu.pc = 0x200;
  cpu.perform(0x1100);
  assert(cpu.pc, 0x100)
});

test("test CALL instruction", function(){
  cpu.pc = 0x200;
  cpu.perform(0x2100);
  assert(cpu.pc, 0x100);
  assert(cpu.stack[0], 0x200);
});

test("test SE XNN when VX == NN", function(){
  cpu.pc = 0x200;
  cpu.v[1] = 0x22;
  cpu.perform(0x3122);
  assert(cpu.pc, 0x200 + 4);
});

test("test SE XNN when VX != NN", function(){
  cpu.pc = 0x200;
  cpu.v[1] = 0x12;
  cpu.perform(0x3122);
  assert(cpu.pc, 0x200 + 2);
});

test("test SNE XNN when VX != NN", function(){
  cpu.pc = 0x200;
  cpu.v[1] = 0x12;
  cpu.perform(0x4122);
  assert(cpu.pc, 0x200 + 4);
});

test("test SNE XNN when VX == NN", function(){
  cpu.pc = 0x200;
  cpu.v[1] = 0x22;
  cpu.perform(0x4122);
  assert(cpu.pc, 0x200 + 2);
});

test("test SE VXVY when VX == VY", function(){
  cpu.pc = 0x200;
  cpu.v[1] = 0x22;
  cpu.v[2] = 0x22;
  cpu.perform(0x5120);
  assert(cpu.pc, 0x200 + 4);
});

test("test SE VXVY when VX != VY", function(){
  cpu.pc = 0x200;
  cpu.v[1] = 0x22;
  cpu.v[2] = 0x2;
  cpu.perform(0x5120);
  assert(cpu.pc, 0x200 + 2);
});

test("test LD X in NN", function(){
  cpu.pc = 0x200;
  cpu.perform(0x6120);
  assert(cpu.v[1], 0x20);
  assert(cpu.pc, 0x200 + 2);
});

test("test ADD NN to X", function(){
  cpu.pc = 0x200;
  cpu.v[1] = 2;
  cpu.perform(0x7120);
  assert(cpu.v[1], 0x20 + 2);
  assert(cpu.pc, 0x200 + 2);
});

test("test LD VX VY", function(){
  cpu.pc = 0x200;
  cpu.v[1] = 0;
  cpu.v[2] = 2;
  cpu.perform(0x8120);
  assert(cpu.v[1], cpu.v[2]);
  assert(cpu.pc, 0x200 + 2);
});

test("test OR VX VY", function(){
  cpu.pc = 0x200;
  cpu.v[1] = 0x0F;
  cpu.v[2] = 0xF0;
  cpu.perform(0x8121);
  assert(cpu.v[1], 0xFF);
  assert(cpu.pc, 0x200 + 2);
});

test("test AND VX VY", function(){
  cpu.pc = 0x200;
  cpu.v[1] = 0x0F;
  cpu.v[2] = 0x04;
  cpu.perform(0x8122);
  assert(cpu.v[1], 0x04);
  assert(cpu.pc, 0x200 + 2);
});

test("test XOR VX VY", function(){
  cpu.pc = 0x200;
  cpu.v[1] = 0x0F;
  cpu.v[2] = 0xF0;
  cpu.perform(0x8123);
  assert(cpu.v[1], 0xFF);
  assert(cpu.pc, 0x200 + 2);
});

test("test ADD VY to VX with no cary", function(){
  cpu.pc = 0x200;
  cpu.v[1] = 0x0E;
  cpu.v[2] = 0x01;
  cpu.perform(0x8124);
  assert(cpu.v[1], 0x0F);
  assert(cpu.v[0xF], 0);
  assert(cpu.pc, 0x200 + 2);
});

test("test ADD VY to VX with cary", function(){
  cpu.pc = 0x200;
  cpu.v[1] = 0xFF;
  cpu.v[2] = 0x01;
  cpu.perform(0x8124);
  assert(cpu.v[1], 0x00);
  assert(cpu.v[0xF], 1);
  assert(cpu.pc, 0x200 + 2);
});

test("test SUB VY to VX without borrow", function(){
  cpu.pc = 0x200;
  cpu.v[1] = 0xFF;
  cpu.v[2] = 0x01;
  cpu.perform(0x8125);
  assert(cpu.v[1], 0xFE);
  assert(cpu.v[0xF], 1);
  assert(cpu.pc, 0x200 + 2);
});

test("test SUB VY to VX with borrow", function(){
  cpu.pc = 0x200;
  cpu.v[1] = 0x00;
  cpu.v[2] = 0x01;
  cpu.perform(0x8125);
  assert(cpu.v[1], 0xFF);
  assert(cpu.v[0xF], 0);
  assert(cpu.pc, 0x200 + 2);
});

test("test SHR VX when LSB is 1", function(){
  cpu.pc = 0x200;
  cpu.v[1] = 0x21;

  cpu.perform(0x8106);
  assert(cpu.v[1], 0x10);
  assert(cpu.v[0xF], 1);
  assert(cpu.pc, 0x200 + 2);
});

test("test SHR VX when LSB is not 1", function(){
  cpu.pc = 0x200;
  cpu.v[1] = 0x22;

  cpu.perform(0x8106);
  assert(cpu.v[1], 0x11);
  assert(cpu.v[0xF], 0);
  assert(cpu.pc, 0x200 + 2);
});

test("test set VX to VY - VX without borrow", function(){
  cpu.pc = 0x200;
  cpu.v[1] = 0x2;
  cpu.v[2] = 0x3;
  cpu.perform(0x8127);
  assert(cpu.v[1], 0x1);
  assert(cpu.v[0xF], 1);
  assert(cpu.pc, 0x200 + 2);
});

test("test set VX to VY - VX without borrow", function(){
  cpu.pc = 0x200;
  cpu.v[1] = 0x01;
  cpu.v[2] = 0x00;
  cpu.perform(0x8127);
  assert(cpu.v[1], 0xFF);
  assert(cpu.v[0xF], 0);
  assert(cpu.pc, 0x200 + 2);
});

test("test SHL with 1 as MSB", function(){
  cpu.reset();
  cpu.v[1] = 0x11;
  cpu.perform(0x812E)
  assert(cpu.v[1], 34);
  assert(cpu.v[0xF], 0);
  assert(cpu.pc, 0x200 + 2);
});

test("test SNE VX VY when VX != VY", function(){
  cpu.reset();
  cpu.v[4] = 0xFE;
  cpu.v[2] = 0xF1;
  cpu.perform(0x9420);
  assert(cpu.pc, 0x200 + 4);
});

test("test SNE VX VY when VX != VY", function(){
  cpu.reset();
  cpu.v[4] = 0xFE;
  cpu.v[2] = 0xFE;
  cpu.perform(0x9420);
  assert(cpu.pc, 0x202);
});

test("test LD I NNN", function(){
  cpu.reset();
  cpu.perform(0xA123);
  assert(cpu.i, 0x123);
});
