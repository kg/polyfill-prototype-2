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
}