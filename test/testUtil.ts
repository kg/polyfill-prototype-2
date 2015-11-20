///<reference path="../third_party/stream.ts"/>

type CallRecord = [string, Array<any>];

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
      this.log.push([propertyName, args]);
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