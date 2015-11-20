/// <reference path="third_party/types.ts" />
/// <reference path="third_party/stream.ts" />
/// <reference path="wasm.ts" />

module AstDecoder {
  export interface IDecodeHandler {
    onOpcode (opcode: Wasm.Opcode, immediates: any[], stack: Wasm.Opcode[]);
  };

  // Expects a subreader containing only the function body
  export function decodeFunctionBody (reader: Stream.ValueReader, handler: IDecodeHandler) : int32 {
    var numOpcodesRead = 0, b;

    while ((b = reader.readByte()) !== false) {
      numOpcodesRead += 1;
      var opcode = <Wasm.Opcode>b;

      handler.onOpcode(opcode, null, null);
    }

    return numOpcodesRead;
  }
}