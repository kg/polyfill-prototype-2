///<reference path="../third_party/qunit/qunit.d.ts"/>
///<reference path="../third_party/stream.ts"/>
///<reference path="../decoder.ts"/>

QUnit.module("tests");

class MockHandler {
  log: Array;

  constructor () {
    this.log = [];
  }

  _record (name) {
    this.log.push(name);
  }

  onMemory (minSizeLog2, maxSizeLog2, externallyVisible) {
    this._record("onMemory");
  }
  onSignature (numArguments, resultType) {
    this._record("onSignature");
  }
  onFunction (nameOffset, signatureIndex, bodyOffset) {
    this._record("onFunction");
  }
  onEndOfModule () {
    this._record("onEndOfModule");
  }
}

test("can decode empty module", function (assert) {
  var mh = new MockHandler();
  var buf = new Uint8Array([]);
  var reader = new Stream.ValueReader(buf);

  var numSections = V8NativeDecoder.decodeModule(reader, mh);

  assert.equal(numSections, 0);
  assert.equal(mh.log.length, 0);
});