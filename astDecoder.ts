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