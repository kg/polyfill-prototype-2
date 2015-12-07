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

module Wasm {
  export enum LocalType {
    Statement = 0,
    I32 = 1,
    I64 = 2,
    F32 = 3,
    F64 = 4
  };

  export enum MemType {
    I8 = 0,
    U8 = 1,
    I16 = 2,
    U16 = 3,
    I32 = 4,
    U32 = 5,
    I64 = 6,
    U64 = 7,
    F32 = 8,
    F64 = 9
  };

  export enum Atomicity {
    None = 0,
    Sequential = 1,
    Acquire = 2,
    Release = 3
  };

  export enum Alignment {
    Aligned = 0,
    Unaligned = 1
  };

  export enum ControlOpcode {
    Nop = 0x00,
    Block = 0x01,
    Loop = 0x02,
    If = 0x03,
    IfThen = 0x04,
    Select = 0x05,
    Br = 0x06,
    BrIf = 0x07,
    TableSwitch = 0x08,
    Return = 0x14,
    Unreachable = 0x15
  };

  export enum ConstantOpcode {
    I8Const = 0x09,
    I32Const = 0x0A,
    I64Const = 0x0B,
    F32Const = 0x0D,
    F64Const = 0x0C
  };

  export enum MiscOpcode {
    GetLocal = 0x0E,
    SetLocal = 0x0F,
    LoadGlobal = 0x10,
    StoreGlobal = 0x11,
    CallFunction = 0x12,
    CallIndirect = 0x13,
    MemorySize = 0x3B,
    ResizeMemL = 0x39,
    ResizeMemH = 0x3A
  };

  export enum LoadOpcode {
    I32LoadMem8S = 0x20,
    I32LoadMem8U = 0x21,
    I32LoadMem16S = 0x22,
    I32LoadMem16U = 0x23,
    I64LoadMem8S = 0x24,
    I64LoadMem8U = 0x25,
    I64LoadMem16S = 0x26,
    I64LoadMem16U = 0x27,
    I64LoadMem32S = 0x28,
    I64LoadMem32U = 0x29,
    I32LoadMem = 0x2a,
    I64LoadMem = 0x2b,
    F32LoadMem = 0x2c,
    F64LoadMem = 0x2d
  };

  export enum StoreOpcode {
    I32StoreMem8 = 0x2e,
    I32StoreMem16 = 0x2f,
    I64StoreMem8 = 0x30,
    I64StoreMem16 = 0x31,
    I64StoreMem32 = 0x32,
    I32StoreMem = 0x33,
    I64StoreMem = 0x34,
    F32StoreMem = 0x35,
    F64StoreMem = 0x36 
  };

  export enum SimpleOpcode {
    I32Add = 0x40, // i_ii          
    I32Sub = 0x41, // i_ii          
    I32Mul = 0x42, // i_ii          
    I32DivS = 0x43, // i_ii         
    I32DivU = 0x44, // i_ii         
    I32RemS = 0x45, // i_ii         
    I32RemU = 0x46, // i_ii         
    I32And = 0x47, // i_ii          
    I32Ior = 0x48, // i_ii          
    I32Xor = 0x49, // i_ii          
    I32Shl = 0x4a, // i_ii          
    I32ShrU = 0x4b, // i_ii         
    I32ShrS = 0x4c, // i_ii         
    I32Eq = 0x4d, // i_ii           
    I32Ne = 0x4e, // i_ii           
    I32LtS = 0x4f, // i_ii          
    I32LeS = 0x50, // i_ii          
    I32LtU = 0x51, // i_ii          
    I32LeU = 0x52, // i_ii          
    I32GtS = 0x53, // i_ii          
    I32GeS = 0x54, // i_ii          
    I32GtU = 0x55, // i_ii          
    I32GeU = 0x56, // i_ii          
    I32Clz = 0x57, // i_i           
    I32Ctz = 0x58, // i_i           
    I32Popcnt = 0x59, // i_i        
    BoolNot = 0x5a, // i_i          
    I64Add = 0x5b, // l_ll          
    I64Sub = 0x5c, // l_ll          
    I64Mul = 0x5d, // l_ll          
    I64DivS = 0x5e, // l_ll         
    I64DivU = 0x5f, // l_ll         
    I64RemS = 0x60, // l_ll         
    I64RemU = 0x61, // l_ll         
    I64And = 0x62, // l_ll          
    I64Ior = 0x63, // l_ll          
    I64Xor = 0x64, // l_ll          
    I64Shl = 0x65, // l_ll          
    I64ShrU = 0x66, // l_ll         
    I64ShrS = 0x67, // l_ll         
    I64Eq = 0x68, // i_ll           
    I64Ne = 0x69, // i_ll           
    I64LtS = 0x6a, // i_ll          
    I64LeS = 0x6b, // i_ll          
    I64LtU = 0x6c, // i_ll          
    I64LeU = 0x6d, // i_ll          
    I64GtS = 0x6e, // i_ll          
    I64GeS = 0x6f, // i_ll          
    I64GtU = 0x70, // i_ll          
    I64GeU = 0x71, // i_ll          
    I64Clz = 0x72, // l_l           
    I64Ctz = 0x73, // l_l           
    I64Popcnt = 0x74, // l_l        
    F32Add = 0x75, // f_ff          
    F32Sub = 0x76, // f_ff          
    F32Mul = 0x77, // f_ff          
    F32Div = 0x78, // f_ff          
    F32Min = 0x79, // f_ff          
    F32Max = 0x7a, // f_ff          
    F32Abs = 0x7b, // f_f           
    F32Neg = 0x7c, // f_f           
    F32CopySign = 0x7d, // f_f      
    F32Ceil = 0x7e, // f_f          
    F32Floor = 0x7f, // f_f         
    F32Trunc = 0x80, // f_f         
    F32NearestInt = 0x81, // f_f    
    F32Sqrt = 0x82, // f_f          
    F32Eq = 0x83, // i_ff           
    F32Ne = 0x84, // i_ff           
    F32Lt = 0x85, // i_ff           
    F32Le = 0x86, // i_ff           
    F32Gt = 0x87, // i_ff           
    F32Ge = 0x88, // i_ff           
    F64Add = 0x89, // d_dd          
    F64Sub = 0x8a, // d_dd          
    F64Mul = 0x8b, // d_dd          
    F64Div = 0x8c, // d_dd          
    F64Min = 0x8d, // d_dd          
    F64Max = 0x8e, // d_dd          
    F64Abs = 0x8f, // d_d           
    F64Neg = 0x90, // d_d           
    F64CopySign = 0x91, // d_d      
    F64Ceil = 0x92, // d_d          
    F64Floor = 0x93, // d_d         
    F64Trunc = 0x94, // d_d         
    F64NearestInt = 0x95, // d_d    
    F64Sqrt = 0x96, // d_d          
    F64Eq = 0x97, // i_dd           
    F64Ne = 0x98, // i_dd           
    F64Lt = 0x99, // i_dd           
    F64Le = 0x9a, // i_dd           
    F64Gt = 0x9b, // i_dd           
    F64Ge = 0x9c, // i_dd           
    I32SConvertF32 = 0x9d, // i_f   
    I32SConvertF64 = 0x9e, // i_d   
    I32UConvertF32 = 0x9f, // i_f   
    I32UConvertF64 = 0xa0, // i_d   
    I32ConvertI64 = 0xa1, // i_l    
    I64SConvertF32 = 0xa2, // l_f   
    I64SConvertF64 = 0xa3, // l_d   
    I64UConvertF32 = 0xa4, // l_f   
    I64UConvertF64 = 0xa5, // l_d   
    I64SConvertI32 = 0xa6, // l_i   
    I64UConvertI32 = 0xa7, // l_i   
    F32SConvertI32 = 0xa8, // f_i   
    F32UConvertI32 = 0xa9, // f_i   
    F32SConvertI64 = 0xaa, // f_l   
    F32UConvertI64 = 0xab, // f_l   
    F32ConvertF64 = 0xac, // f_d    
    F32ReinterpretI32 = 0xad, // f_i
    F64SConvertI32 = 0xae, // d_i   
    F64UConvertI32 = 0xaf, // d_i   
    F64SConvertI64 = 0xb0, // d_l   
    F64UConvertI64 = 0xb1, // d_l   
    F64ConvertF32 = 0xb2, // d_f    
    F64ReinterpretI64 = 0xb3, // d_l
    I32ReinterpretF32 = 0xb4, // i_f
    I64ReinterpretF64 = 0xb5, // l_d
  };

  export type Opcode = (
    ControlOpcode |
    ConstantOpcode |
    MiscOpcode |
    LoadOpcode |
    StoreOpcode |
    SimpleOpcode
  );

  export var Opcodes : any = {};

  var tables = [
    ControlOpcode, ConstantOpcode, MiscOpcode,
    LoadOpcode, StoreOpcode, SimpleOpcode
  ];

  for (var i = 0, l = tables.length; i < l; i++) {
    var table = tables[i];
    for (var key in table) {
      if (!table.hasOwnProperty(key))
        continue;

      if (Opcodes[key])
        throw new Error("Duplicate opcode " + key);

      Opcodes[key] = table[key];
    }
  }
}