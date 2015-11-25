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

  function defineSignatures (opcodes: Wasm.Opcode[], args: OpcodeArg[]) {
    for (var i = 0, l = opcodes.length; i < l; i++)
      defineSignature(opcodes[i], ...args);
  }

  export function getName (opcode: Wasm.Opcode) : string {
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
      throw new Error("No signature for opcode 0x" + opcode.toString(16) + " (" + getName(opcode) + ")");
    else
      return result;
  };

  defineSignature(Wasm.ControlOpcode.Nop);
  defineSignature(Wasm.ControlOpcode.Unreachable);
  defineSignature(Wasm.MiscOpcode.MemorySize);

  const _n : OpcodeArg[] = [[OpcodeArgType.Node, 1]];
  const _nn : OpcodeArg[] = [[OpcodeArgType.Node, 2]];

  defineSignatures(
    [
      Wasm.SimpleOpcode.I32Clz,
      Wasm.SimpleOpcode.I32Ctz,
      Wasm.SimpleOpcode.I32Popcnt,
    ], _n
  );

  defineSignatures(
    [
      Wasm.SimpleOpcode.I32Add,
      Wasm.SimpleOpcode.I32Sub,
      Wasm.SimpleOpcode.I32Mul,
      Wasm.SimpleOpcode.I32DivS,
      Wasm.SimpleOpcode.I32DivU,
      Wasm.SimpleOpcode.I32RemS,
      Wasm.SimpleOpcode.I32RemU,
      Wasm.SimpleOpcode.I32And,
      Wasm.SimpleOpcode.I32Ior,
      Wasm.SimpleOpcode.I32Xor,
      Wasm.SimpleOpcode.I32Shl,
      Wasm.SimpleOpcode.I32ShrU,
      Wasm.SimpleOpcode.I32ShrS,
      Wasm.SimpleOpcode.I32Eq,
      Wasm.SimpleOpcode.I32Ne,
      Wasm.SimpleOpcode.I32LtS, 
      Wasm.SimpleOpcode.I32LeS,
      Wasm.SimpleOpcode.I32LtU, 
      Wasm.SimpleOpcode.I32LeU, 
      Wasm.SimpleOpcode.I32GtS, 
      Wasm.SimpleOpcode.I32GeS, 
      Wasm.SimpleOpcode.I32GtU, 
      Wasm.SimpleOpcode.I32GeU,
    ], _nn
  );

  defineSignatures(
    [
      Wasm.SimpleOpcode.I64Clz,
      Wasm.SimpleOpcode.I64Ctz,
      Wasm.SimpleOpcode.I64Popcnt,
    ], _n
  );

  defineSignatures(
    [
      Wasm.SimpleOpcode.I64Add,
      Wasm.SimpleOpcode.I64Sub,
      Wasm.SimpleOpcode.I64Mul,
      Wasm.SimpleOpcode.I64DivS,
      Wasm.SimpleOpcode.I64DivU,
      Wasm.SimpleOpcode.I64RemS,
      Wasm.SimpleOpcode.I64RemU,
      Wasm.SimpleOpcode.I64And,
      Wasm.SimpleOpcode.I64Ior,
      Wasm.SimpleOpcode.I64Xor,
      Wasm.SimpleOpcode.I64Shl,
      Wasm.SimpleOpcode.I64ShrU,
      Wasm.SimpleOpcode.I64ShrS,
      Wasm.SimpleOpcode.I64Eq,
      Wasm.SimpleOpcode.I64Ne,
      Wasm.SimpleOpcode.I64LtS, 
      Wasm.SimpleOpcode.I64LeS,
      Wasm.SimpleOpcode.I64LtU, 
      Wasm.SimpleOpcode.I64LeU, 
      Wasm.SimpleOpcode.I64GtS, 
      Wasm.SimpleOpcode.I64GeS, 
      Wasm.SimpleOpcode.I64GtU, 
      Wasm.SimpleOpcode.I64GeU,
    ], _nn
  );

  defineSignatures(
    [
      Wasm.SimpleOpcode.I32SConvertF32,
      Wasm.SimpleOpcode.I32SConvertF64,
      Wasm.SimpleOpcode.I32UConvertF32,
      Wasm.SimpleOpcode.I32UConvertF64,
      Wasm.SimpleOpcode.I32ConvertI64,
      Wasm.SimpleOpcode.I64SConvertF32,
      Wasm.SimpleOpcode.I64SConvertF64,
      Wasm.SimpleOpcode.I64UConvertF32,
      Wasm.SimpleOpcode.I64UConvertF64,
      Wasm.SimpleOpcode.I64SConvertI32,
      Wasm.SimpleOpcode.I64UConvertI32,
      Wasm.SimpleOpcode.F32SConvertI32,
      Wasm.SimpleOpcode.F32UConvertI32,
      Wasm.SimpleOpcode.F32SConvertI64,
      Wasm.SimpleOpcode.F32UConvertI64,
      Wasm.SimpleOpcode.F32ConvertF64,
      Wasm.SimpleOpcode.F32ReinterpretI32,
      Wasm.SimpleOpcode.F64SConvertI32,
      Wasm.SimpleOpcode.F64UConvertI32,
      Wasm.SimpleOpcode.F64SConvertI64,
      Wasm.SimpleOpcode.F64UConvertI64,
      Wasm.SimpleOpcode.F64ConvertF32,
      Wasm.SimpleOpcode.F64ReinterpretI64,
      Wasm.SimpleOpcode.I32ReinterpretF32,
      Wasm.SimpleOpcode.I64ReinterpretF64,
    ], _n
  );

  defineSignature(Wasm.ConstantOpcode.I8Const, [OpcodeArgType.Integer, 1]);
  defineSignature(Wasm.ConstantOpcode.I32Const, [OpcodeArgType.Integer, 4]);
  defineSignature(Wasm.ConstantOpcode.I64Const, [OpcodeArgType.Integer, 8]);
  defineSignature(Wasm.ConstantOpcode.F32Const, [OpcodeArgType.Float, 4]);
  defineSignature(Wasm.ConstantOpcode.F64Const, [OpcodeArgType.Float, 8]);
}