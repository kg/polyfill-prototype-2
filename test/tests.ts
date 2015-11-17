///<reference path="../third_party/qunit/qunit.d.ts"/>
///<reference path="../third_party/stream.ts"/>
///<reference path="../decoder.ts"/>

QUnit.module("tests");

type CallRecord = [string, Array<any>];

class MockHandlerProxyHandler {
  log : Array<CallRecord>;

  constructor (log: Array<CallRecord>) {
    this.log = log;
  }

  get (state, propertyName : string, receiver) {
    var self = this;
    return function mockedMethod () {
      self.log.push([propertyName, Array.prototype.slice.call(arguments)]);
    };
  }
};

declare class Proxy {
  constructor (state: any, handler: any);
}

function makeMockHandler (log) : V8NativeDecoder.IDecodeHandler {
  var handler = new MockHandlerProxyHandler(log);
  var result = new Proxy({}, handler);
  return <V8NativeDecoder.IDecodeHandler>result;
};

function makeReader (bytes: Array<byte>) {
  var buf = new Uint8Array(bytes);
  return new Stream.ValueReader(buf);
}

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