/*
   Copyright 2015 WebAssembly Community Group participants

   Licensed under the Apache License, Version 2.0 (the "License"),
   with a runtime exception;
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       https://github.com/WebAssembly/design/blob/master/LICENSE

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

///<reference path="../third_party/qunit/qunit.d.ts"/>
///<reference path="../third_party/stream.ts"/>
///<reference path="../moduleDecoder.ts"/>
///<reference path="../astDecoder.ts"/>
///<reference path="../wasm.ts"/>
///<reference path="testUtil.ts"/>

QUnit.module("moduleDecoder");

test("decodes empty module", function (assert) {
  var log = [];
  var mh = makeMockHandler<ModuleDecoder.IDecodeHandler>(log);
  var reader = makeReader([]);

  var numSections = ModuleDecoder.decodeModule(reader, mh);

  assert.equal(numSections, 0);
  assert.equal(log.length, 0);
});

test("decodes memory section", function (assert) {
  var log = [];
  var mh = makeMockHandler<ModuleDecoder.IDecodeHandler>(log);
  var reader = makeReader([
    ModuleDecoder.Section.Memory,
    0x00, 0x00, 0x01
  ]);

  var numSections = ModuleDecoder.decodeModule(reader, mh);

  assert.equal(numSections, 1);
  assert.deepEqual(log, [
    ["onMemory", [0, 0, true]]
  ]);
});

test("decodes signature section", function (assert) {
  var log = [];
  var mh = makeMockHandler<ModuleDecoder.IDecodeHandler>(log);
  var reader = makeReader([
    ModuleDecoder.Section.Signatures,
    0x02,
    0x00, 0x00,
    0x01, 0x02
  ]);

  var numSections = ModuleDecoder.decodeModule(reader, mh);

  assert.equal(numSections, 1);
  assert.deepEqual(log, [
    ["onSignature", [0, 0]],
    ["onSignature", [1, 2]],
  ]);
});

test("decodes function section", function (assert) {
  var log = [];
  var mh = makeMockHandler<ModuleDecoder.IDecodeHandler>(log);
  var reader = makeReader([
    ModuleDecoder.Section.Functions,
    0x02,

    0x00, // flags
    0x00, 0x00, // signature index
    0x00, 0x00, 0x00, 0x00, // name offset
    0x00, 0x00, // body size

    0x01, 
    0x02, 0x00,
    0x03, 0x00, 0x00, 0x00,
    0x04, 0x00,
    0x00, 0x00, 0x00, 0x00, // body

    ModuleDecoder.Section.End
  ]);

  var numSections = ModuleDecoder.decodeModule(reader, mh);

  assert.equal(numSections, 2);
  assert.deepEqual(log, [
    ["onFunction", [0, 0, 0, 11, 0]],
    ["onFunction", [1, 2, 3, 20, 4]],
    ["onEndOfModule", []]
  ]);
});



QUnit.module("astDecoder");

test("decodes empty body", function (assert) {
  var log = [];
  var mh = makeMockHandler<AstDecoder.IDecodeHandler>(log);
  var reader = makeReader([]);

  var numOpcodes = AstDecoder.decodeFunctionBody(reader, mh);

  assert.equal(numOpcodes, 0);
  assert.equal(log.length, 0);
});

test("decodes argumentless opcodes", function (assert) {
  var log = [];
  var mh = makeMockHandler<AstDecoder.IDecodeHandler>(log);
  var reader = makeReader([
    Wasm.ControlOpcode.Nop,
    Wasm.ControlOpcode.Unreachable,
    Wasm.MiscOpcode.MemorySize
  ]);

  var numOpcodes = AstDecoder.decodeFunctionBody(reader, mh);

  assert.equal(numOpcodes, 3);
  assert.deepEqual(log, [
    ["onOpcode", [ Wasm.ControlOpcode.Nop, 0, [], [] ]],
    ["onOpcode", [ Wasm.ControlOpcode.Unreachable, 0, [], [] ]],
    ["onOpcode", [ Wasm.MiscOpcode.MemorySize, 0, [], [] ]]
  ]);
});

test("immediate decoder", function (assert) {
  var log = [];
  var mh = makeMockHandler<AstDecoder.IDecodeHandler>(log);
  var reader = makeReader([
    // Wasm.ConstantOpcode.I8Const,
    0x02,    

    // Wasm.ConstantOpcode.I32Const,
    0x04, 0x01, 0x00, 0x00,

    // todo: i64

    // Wasm.ConstantOpcode.F32Const,
    0xf3, 0x7f, 0x14, 0x42

    // todo: f64
  ]);

  assert.equal(
    AstDecoder.decodeImmediate(reader, 1, false),
    2
  );

  assert.equal(
    AstDecoder.decodeImmediate(reader, 4, false),
    260
  );

  assert.equal(
    Math.floor(AstDecoder.decodeImmediate(reader, 4, true) * 1000),
    37124
  );
});

test("decodes constant opcodes", function (assert) {
  var log = [];
  var mh = makeMockHandler<AstDecoder.IDecodeHandler>(log);
  var reader = makeReader([
    Wasm.ConstantOpcode.I8Const,
    0x02,    

    Wasm.ConstantOpcode.I32Const,
    0x04, 0x01, 0x00, 0x00,

    // todo: i64

    Wasm.ConstantOpcode.F32Const,
    0xf3, 0x7f, 0x14, 0x42

    // todo: f64
  ]);

  var numOpcodes = AstDecoder.decodeFunctionBody(reader, mh);

  assert.equal(numOpcodes, 3);
  assert.deepEqual(log, [
    ["onOpcode", [ Wasm.ConstantOpcode.I8Const, 0, [2], [] ]],
    ["onOpcode", [ Wasm.ConstantOpcode.I32Const, 0, [260], [] ]],
    // fixme: fp precision
    ["onOpcode", [ Wasm.ConstantOpcode.F32Const, 0, [37.12495040893555], [] ]]
  ]);
});

test("decodes simple nested arithmetic", function (assert) {
  var log = [];
  var mh = makeMockHandler<AstDecoder.IDecodeHandler>(log);
  var reader = makeReader([
    Wasm.SimpleOpcode.I32Add,
    Wasm.ConstantOpcode.I8Const,
    0x03,
    Wasm.ConstantOpcode.I8Const,
    0x07
  ]);

  var numOpcodes = AstDecoder.decodeFunctionBody(reader, mh);

  assert.equal(numOpcodes, 3);
  assert.deepEqual(log, [
    ["onBeginOpcode", [ Wasm.SimpleOpcode.I32Add, [] ]],
    ["onOpcode", [ Wasm.ConstantOpcode.I8Const, 0, [0x03], [Wasm.SimpleOpcode.I32Add] ]],
    ["onOpcode", [ Wasm.ConstantOpcode.I8Const, 0, [0x07], [Wasm.SimpleOpcode.I32Add] ]],
    ["onOpcode", [ Wasm.SimpleOpcode.I32Add, 2, [], [] ]],
  ]);
});