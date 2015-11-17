///<reference path="../third_party/qunit/qunit.d.ts"/>
///<reference path="../third_party/stream.ts"/>
///<reference path="../decoder.ts"/>
///<reference path="testUtil.ts"/>

QUnit.module("tests");

test("can decode empty module", function (assert) {
  var log = [];
  var mh = makeMockHandler(log);
  var reader = makeReader([]);

  var numSections = V8NativeDecoder.decodeModule(reader, mh);

  assert.equal(numSections, 0);
  assert.equal(log.length, 0);
});

test("decodes memory section", function (assert) {
  var log = [];
  var mh = makeMockHandler(log);
  var reader = makeReader([
    V8NativeDecoder.Section.Memory,
    0x00, 0x00, 0x01
  ]);

  var numSections = V8NativeDecoder.decodeModule(reader, mh);

  assert.equal(numSections, 1);
  assert.deepEqual(log, [
    ["onMemory", [0, 0, true]]
  ]);
});

test("decodes signature section", function (assert) {
  var log = [];
  var mh = makeMockHandler(log);
  var reader = makeReader([
    V8NativeDecoder.Section.Signatures,
    0x02,
    0x00, 0x00,
    0x01, 0x02
  ]);

  var numSections = V8NativeDecoder.decodeModule(reader, mh);

  assert.equal(numSections, 1);
  assert.deepEqual(log, [
    ["onSignature", [0, 0]],
    ["onSignature", [1, 2]],
  ]);
});

test("decodes function section", function (assert) {
  var log = [];
  var mh = makeMockHandler(log);
  var reader = makeReader([
    V8NativeDecoder.Section.Functions,
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

    V8NativeDecoder.Section.End
  ]);

  var numSections = V8NativeDecoder.decodeModule(reader, mh);

  assert.equal(numSections, 2);
  assert.deepEqual(log, [
    ["onFunction", [0, 0, 0, 11, 0]],
    ["onFunction", [1, 2, 3, 20, 4]],
    ["onEndOfModule", []]
  ]);
});