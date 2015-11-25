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

function makeMockHandler<T> (log, methods?: Object) : T {
  var handler = new MockHandlerProxyHandler(log, methods);
  var result = new Proxy({}, handler);
  return <T>result;
};

function makeReader (bytes: Array<byte>) {
  var buf = new Uint8Array(bytes);
  return new Stream.ValueReader(buf);
}