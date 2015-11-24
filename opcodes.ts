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

/// <reference path="wasm.ts" />

module Wasm.OpcodeInfo {
  export class _ChildNode {
  }

  // Gross
  const ChildNode = new _ChildNode();

  export enum ImmediateType {
    I8,
    I32,
    I64,
    F32,
    F64
  };

  type OpcodeArg = (_ChildNode | ImmediateType);

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
    Signatures[opcode] = new Signature(opcode, args);
  }

  defineSignature(Wasm.ConstantOpcode.I8Const, ImmediateType.I8);
  defineSignature(Wasm.ConstantOpcode.I32Const, ImmediateType.I32);
  defineSignature(Wasm.ConstantOpcode.I64Const, ImmediateType.I64);
  defineSignature(Wasm.ConstantOpcode.F32Const, ImmediateType.F32);
  defineSignature(Wasm.ConstantOpcode.F64Const, ImmediateType.F64);
}