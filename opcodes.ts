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
/// <reference path="wasm.ts" />

module Wasm.OpcodeInfo {
  export enum OpcodeArgType {
    Node,
    Integer,
    Float
  };

  export type OpcodeArg = [OpcodeArgType, int32];

  export class Signature {
    opcode : Wasm.Opcode;
    arguments : OpcodeArg[];

    public constructor (opcode: Wasm.Opcode, opcodeArguments: OpcodeArg[]) {
      this.opcode = opcode;
      this.arguments = opcodeArguments;
    }
  }

  export var Signatures = {};

  function defineSignature (opcode: Wasm.Opcode, ...args: OpcodeArg[]) {
    if (typeof (opcode) !== "number")
      throw new Error("Invalid opcode passed to defineSignature");

    Signatures[opcode] = new Signature(opcode, args);
  }

  export function getOpcodeName (opcode: Wasm.Opcode) : string {
    var tables = [
      Wasm.ControlOpcode,
      Wasm.ConstantOpcode,
      Wasm.MiscOpcode,
      Wasm.LoadOpcode,
      Wasm.StoreOpcode,
      Wasm.SimpleOpcode
    ];

    for (var i = 0, l = tables.length; i < l; i++) {
      var result = tables[i][opcode];
      if (typeof (result) === "string")
        return result;
    }

    return "<unknown>";
  };

  export function getSignature (opcode: Wasm.Opcode) : Signature {
    var result = Signatures[opcode];

    if (!result)
      throw new Error("No signature for opcode " + opcode + " (" + getOpcodeName(opcode) + ")");
    else
      return result;
  };

  defineSignature(Wasm.ControlOpcode.Nop);
  defineSignature(Wasm.ControlOpcode.Unreachable);
  defineSignature(Wasm.MiscOpcode.MemorySize);

  defineSignature(Wasm.SimpleOpcode.I32Add, [OpcodeArgType.Node, 2]);

  defineSignature(Wasm.ConstantOpcode.I8Const, [OpcodeArgType.Integer, 1]);
  defineSignature(Wasm.ConstantOpcode.I32Const, [OpcodeArgType.Integer, 4]);
  defineSignature(Wasm.ConstantOpcode.I64Const, [OpcodeArgType.Integer, 8]);
  defineSignature(Wasm.ConstantOpcode.F32Const, [OpcodeArgType.Float, 4]);
  defineSignature(Wasm.ConstantOpcode.F64Const, [OpcodeArgType.Float, 8]);
}