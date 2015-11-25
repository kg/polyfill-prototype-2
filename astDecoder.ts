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

/// <reference path="third_party/types.ts" />
/// <reference path="third_party/stream.ts" />
/// <reference path="wasm.ts" />
/// <reference path="opcodes.ts" />

module AstDecoder {
  export interface IDecodeHandler {
    // Runs at the beginning of decoding for a given opcode.
    // Immediates and child nodes have not been decoded.
    onBeginOpcode (
      opcode: Wasm.Opcode,
      // decoder internal state. copy if you wish to retain.
      // lists the opcodes above this opcode (non-inclusive)
      stack: Wasm.Opcode[]
    );

    // Runs once an opcode is fully decoded (all children have
    //  already been decoded, and all immediates are ready)
    onOpcode (
      opcode: Wasm.Opcode, 
      childNodesDecoded: int32,
      // decoder internal state. copy if you wish to retain.
      immediates: any[], 
      // decoder internal state. copy if you wish to retain.
      // lists the opcodes above this opcode (non-inclusive)
      stack: Wasm.Opcode[]
    );
  };

  export function decodeImmediate (reader: Stream.ValueReader, immediateSizeBytes: uint32, floatingPoint: boolean) : any {
    var _bytes = reader.readScratchBytes(immediateSizeBytes);
    if (_bytes === false)
      return false;

    var bytes = <Uint8Array>_bytes;

    // FIXME: Slow
    if (floatingPoint) {
      if (immediateSizeBytes === 4)
        return (new Float32Array(bytes.buffer, 0, 1))[0];
      else if (immediateSizeBytes === 8)
        return (new Float64Array(bytes.buffer, 0, 1))[0];
      else
        throw new Error("Expected f32 or f64");
    } else {
      if (immediateSizeBytes === 1)
        return bytes[0];
      else if (immediateSizeBytes === 2)
        return (new Int16Array(bytes.buffer, 0, 1))[0];      
      else if (immediateSizeBytes === 4)
        return (new Int32Array(bytes.buffer, 0, 1))[0];        
      else if (immediateSizeBytes === 8)
        throw new Error("i64 not implemented");
    }
  };

  // Expects a subreader containing only the function body
  export function decodeFunctionBody (reader: Stream.ValueReader, handler: IDecodeHandler) : int32 {
    var numOpcodesRead = 0, b;
    var stack = [];
    var immediates = [];

    while ((b = reader.readByte()) !== false) {
      numOpcodesRead += 1;
      var opcode = <Wasm.Opcode>b;

      handler.onBeginOpcode(opcode, stack);

      var signature = Wasm.OpcodeInfo.getSignature(opcode);
      immediates.length = 0;

      var childNodesDecoded = 0;
      for (var i = 0, l = signature.arguments.length; i < l; i++) {
        var arg = signature.arguments[i];

        if (arg[0] === Wasm.OpcodeInfo.OpcodeArgType.Node) {
          throw new Error("Nested opcodes not yet implemented");
        } else {
          var immediate = decodeImmediate(reader, arg[1], arg[0] === Wasm.OpcodeInfo.OpcodeArgType.Float);
          immediates.push(immediate);
        }
      }

      handler.onOpcode(opcode, childNodesDecoded, immediates, stack);
    }

    return numOpcodesRead;
  };
}