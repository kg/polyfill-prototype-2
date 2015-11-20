/// <reference path="third_party/types.ts" />
/// <reference path="third_party/stream.ts" />
/// <reference path="wasm.ts" />

module AstDecoder {
  export interface IDecodeHandler {
    onOpcode (
      opcode: Wasm.Opcode, 
      // decoder internal state. copy if you wish to retain.
      immediates: any[], 
      // decoder internal state. copy if you wish to retain.
      stack: Wasm.Opcode[]
    );
  };

  // Expects a subreader containing only the function body
  export function decodeFunctionBody (reader: Stream.ValueReader, handler: IDecodeHandler) : int32 {
    var numOpcodesRead = 0, b;
    var immediates = [];
    var stack = [];

    while ((b = reader.readByte()) !== false) {
      numOpcodesRead += 1;
      var opcode = <Wasm.Opcode>b;

      handler.onOpcode(opcode, immediates, stack);
    }

    return numOpcodesRead;
  }
}