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
    // Called by the decoder to determine how many child nodes 
    //  a given function call has. Write the results into 'result'    
    getFunctionSignatureByIndex (
      index: uint32,
      result: {
        numArguments: uint32,
        returnType: Wasm.LocalType
      }
    );

    // Any node with child nodes produces this event before
    //  decoding child nodes.
    // Nodes without child nodes only produce onOpcode.
    onBeginOpcode (
      opcode: Wasm.Opcode,
      // decoder internal state. copy if you wish to retain.
      // lists the opcodes enclosing this opcode (non-inclusive)
      stack: Wasm.Opcode[]
    );

    // This event is produced once a node has been completely
    //  decoded (including any child nodes).
    onOpcode (
      opcode: Wasm.Opcode, 
      // The number of child nodes that were decoded as this
      //  opcode's arguments (i.e. 2 for an add)
      childNodesDecoded: uint32,
      // decoder internal state. copy if you wish to retain.
      // the immediate value args to the opcode (ints, floats) 
      immediates: Immediate[], 
      // decoder internal state. copy if you wish to retain.
      // lists the opcodes enclosing this opcode (non-inclusive)
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

  const emptyArray = [];

  // TODO: Nonrecursive
  function decodeSpecial (reader: Stream.ValueReader, handler: IDecodeHandler, stack: Wasm.Opcode[], immediates, opcode: Wasm.Opcode, specialType: Wasm.OpcodeInfo.SpecialArgType) : int32 {    
    console.log("decode special " + specialType);

    switch (specialType) {
      case Wasm.OpcodeInfo.SpecialArgType.FunctionCall:
        // FIXME: LEB128?
        // FIXME: eof handling
        var signatureIndex = reader.readByte();
        // FIXME: reuse
        var signature = {
          numArguments: 0,
          returnType: 0
        };
        handler.getFunctionSignatureByIndex(<uint32>signatureIndex, signature);

        stack.push(opcode);

        console.log("special argument count " + signature.numArguments);
        for (var i = 0; i < signature.numArguments; i++)
          decodeNode(reader, handler, stack);

        if (stack.pop() !== opcode)
          throw new Error("Decode stack misalignment");

        immediates.push(signatureIndex);

        return signature.numArguments;
    }

    throw new Error("Special type " + specialType + " (" + Wasm.OpcodeInfo.SpecialArgType[specialType] + ") not implemented");
  }

  // TODO: Nonrecursive
  function decodeNode (reader: Stream.ValueReader, handler: IDecodeHandler, stack: Wasm.Opcode[]) : int32 {
    var b = reader.readByte();
    if (b === false)
      return 0;

    var result = 1;
    var opcode = <Wasm.Opcode>b;
    console.log("+opcode " + b + "(" + Wasm.OpcodeInfo.getName(opcode) + ")");
    var signature = Wasm.OpcodeInfo.getSignature(opcode);
    var childNodesDecoded = 0;

    // FIXME: Reuse
    var immediates = [];

    var hasFiredBegin = false;

    for (var i = 0, l = signature.arguments.length; i < l; i++) {
      var arg = signature.arguments[i];

      if (!Array.isArray(arg)) {
        childNodesDecoded += decodeSpecial(reader, handler, stack, immediates, opcode, arg);
      } else {
        var argType = arg[0];

        if (argType === Wasm.OpcodeInfo.OpcodeArgType.Node) {
          // opcode argument record: [Node, numNodes]

          // Any node with child nodes fires an onBeginOpcode first
          if (!hasFiredBegin) {
            hasFiredBegin = true;
            handler.onBeginOpcode(opcode, stack);          
          }

          var childNodeCount = arg[1];
          stack.push(opcode);

          for (var j = 0; j < childNodeCount; j++)
            result += decodeNode(reader, handler, stack);

          if (stack.pop() !== opcode)
            throw new Error("Decode stack misalignment");
          childNodesDecoded += childNodeCount;
        } else {
          // opcode argument record: [Int | Float, sizeBytes]

          var isFloat = argType === Wasm.OpcodeInfo.OpcodeArgType.Float;
          var sizeBytes = arg[1];

          var immediate = decodeImmediate(reader, sizeBytes, isFloat);
          immediates.push(immediate);
        }
      }
    }

    console.log("-opcode " + b + " w/" + childNodesDecoded + " child nodes");

    handler.onOpcode(opcode, childNodesDecoded, immediates || emptyArray, stack);

    return result;
  }

  // Expects a subreader containing only the function body
  export function decodeFunctionBody (reader: Stream.ValueReader, handler: IDecodeHandler) : int32 {
    var numOpcodesRead = 0, b;
    var stack = [];

    while (!reader.eof && !reader.hasOverread)
      numOpcodesRead += decodeNode(reader, handler, stack);

    return numOpcodesRead;
  };
}