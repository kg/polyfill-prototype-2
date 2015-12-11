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

///<reference path="../moduleDecoder.ts"/>
///<reference path="../astDecoder.ts"/>
///<reference path="../third_party/stream.ts"/>

type CallRecord = [string, any[]];

// Copies array literals inside of an array.
// Doesn't handle object references or cycles.
function simpleCloneArguments (args: any[]) {
  var result = new Array(args.length);

  for (var i = 0, l = args.length; i < l; i++) {
    var val = args[i];

    if (Array.isArray(val))
      val = simpleCloneArguments(val);

    result[i] = val;
  }

  return result;
};

class MockHandlerProxyHandler {
  log : Array<CallRecord>;
  methods : Object;

  constructor (log: Array<CallRecord>, methods: Object) {
    this.log = log;
    this.methods = methods || {};
  }

  get (state, propertyName : string, receiver) {
    if (this.methods.hasOwnProperty(propertyName))
      return this.methods[propertyName];

    return (...args) => {
      this.log.push([propertyName, simpleCloneArguments(args)]);
    };
  }
};

declare class Proxy {
  constructor (state: any, handler: any);
}

function makeLogHandler<T> (log, methods?: Object) : T {
  var handler = new MockHandlerProxyHandler(log, methods);
  var result = new Proxy({}, handler);
  return <T>result;
};

function makeReader (bytes: Array<byte> | Uint8Array) {
  if (bytes instanceof Uint8Array) {
    return new Stream.ValueReader(bytes);
  } else {
    var buf = new Uint8Array(bytes);
    return new Stream.ValueReader(buf);
  }
}

function readText (relativeUrl: string) {
  var xhr = new XMLHttpRequest();

  xhr.open("GET", relativeUrl, false);
  xhr.send();
  var text = xhr.responseText;

  return text;
}

function readV8Dump (relativeUrl: string) {
  var text = readText(relativeUrl);
  console.log("read " + text.length + " char(s) from " + relativeUrl);

  var lines = text.split(/\r\n|\n/g);

  var foundHeader = false;

  var commentRe = /;.*/g;
  var lineRe = /([0-9a-zA-Z]+):( *)([0-9a-zA-Z ]+)/;
  var spaceRe = / /g;

  var result = [];

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();

    if (line === "(;; STDOUT ;;;") {
      foundHeader = true;
      continue;
    } else if (!foundHeader)
      continue;

    var lineClean = line.replace(commentRe, "").trim();

    if (!lineClean.length)
      continue;

    var matches = lineRe.exec(lineClean);

    var offset = parseInt(matches[1], 16);
    var bytes = matches[3].replace(spaceRe, "");

    if (offset === result.length) {
      // Append
      for (var j = 0; j < bytes.length; j += 2) {
        var byte = parseInt(bytes.substr(j, 2), 16);

        result.push(byte);
      }
    } else {
      // Fixup
      for (var j = 0; j < bytes.length; j += 2) {
        var byte = parseInt(bytes.substr(j, 2), 16);

        result[offset + (j / 2)] = byte;
      }
    }
  }

  return new Uint8Array(result);
}

type MockSignature = [WasmTypeId, WasmTypeId[]];

class MockModuleHandler implements ModuleDecoder.IDecodeHandler {
  signatures: MockSignature[];
  astHandler: MockAstHandler;
  _assert: any;

  constructor (assert) {
    this.astHandler = new MockAstHandler(assert);
    this.signatures = this.astHandler.signatures;
    this._assert = assert;
  }

  onMemory (...args) {
  }

  onSignature (resultType, argumentTypes) {
    var sig : MockSignature = [
      resultType, argumentTypes.slice()
    ];
    console.log("//  signature " + sig[0] + " [" + sig[1] + "]");
    this.signatures.push(sig);
  }

  onFunction (...args) {
    console.log("//  function " + args);
    return this.astHandler;
  }

  onEndOfModule () {
  }
}

class MockAstHandler implements AstDecoder.IDecodeHandler {
  signatures: MockSignature[];
  stream: any[];
  _assert: any;

  constructor (assert) {
    this.stream = [];
    this.signatures = [];
    this._assert = assert;
  }

  getFunctionSignatureByIndex (index, result) {
    var signature = this.signatures[index];
    result.numArguments = signature[1].length;
    result.returnType = signature[0];
  }

  onBeginOpcode (opcode, _) {
  }

  onOpcode (opcode, childNodesDecoded, immediates, _) {
    var name = Wasm.OpcodeInfo.getName(opcode);
    var node = new _Node(this._assert, name);

    if (childNodesDecoded) {
      var childNodes = this.stream.slice(-childNodesDecoded);
      if (childNodes.length !== childNodesDecoded)
        throw new Error("Didn't find my children :-((((");

      this.stream.splice(-childNodesDecoded, childNodesDecoded);

      node.args.push.apply(node.args, childNodes);
    }

    node.args.push.apply(node.args, immediates);

    this.stream.push(node);
  }
};

class _Node {
  name: string;
  args: any[];
  _assert: any;

  public constructor (assert, name: string) {
    this._assert = assert;
    this.name = name;
    this.args = [];
  }

  toString () : string {
    var result = "(" + this.name;

    for (var i = 0, l = this.args.length; i < l; i++) {
      var child = this.args[i].toString();

      if ((this.args.length === 1) && (child.indexOf("(") < 0)) {
        result += " " + child;
        break;
      } else if (i === 0) {
        result += "\n";
      }

      var childLines = child.split("\n");
      for (var j = 0, l2 = childLines.length; j < l2; j++) {
        result += "  " + childLines[j] + "\n";
      }
    }

    result += ")";
    return result;
  }

  assertIs (name: string) {
    this._assert.equal(this.name, name);
  }

  assertTree (names: (string | any[])[]) {
    this._assert.equal(this.name, names[0]);

    var node = this;
    var nodeName = this.name;
    var parent = null;

    for (var i = 1, l = names.length; i < l; i++) {
      var nameOrArray = names[i];
      var next = null;

      if (typeof (nameOrArray) === "string") {
        var childName = <string>nameOrArray;
        for (var j = 0, l2 = node.args.length; j < l2; j++) {
          var child = node.args[j];
          if (child.name === childName)
            next = child;
          break;
        }

        this._assert.ok(next, "expected '" + nodeName + "' to have a child '" + childName + "'");

        if (next) {
          parent = node;
          node = next;
          nodeName = node.name;
        } else {
          return false;
        }
      } else {
        var array = <any[]>nameOrArray;
        this._assert.equal(node.args.length, array.length, "expected '" + nodeName + "' to have " + array.length + " child(ren)");

        for (var j = 0, l2 = array.length; j < l2; j++) {
          var child = node.args[j];

          if (child && child.assertTree)
            child.assertTree(array[j]);
          else
            this._assert.equal(child, array[j], "expected '" + nodeName + "' to have child #" + j + " with value '" + array[j] + "'");
        }

        return true;
      }
    }

    if (node.args.length !== 0)
      this._assert.ok(false, "expected '" + nodeName + "' to have no children");
  }
};