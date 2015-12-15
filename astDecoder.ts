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

  const tracing = true;

  function trace (...args) {
    if (!tracing)
      return;

    console.log.apply(console, args);
  }

  export function decodeImmediate (reader: Stream.ValueReader, immediateSizeBytes: uint32, floatingPoint: boolean) : any {
    if (floatingPoint) {
      if (immediateSizeBytes === 4)
        return reader.readFloat32();
      else if (immediateSizeBytes === 8)
        return reader.readFloat64();
      else
        throw new Error("Expected f32 or f64");
    } else {
      if (immediateSizeBytes === 1)
        return reader.readByte();
      else if (immediateSizeBytes === 2)
        return reader.readInt16();
      else if (immediateSizeBytes === 4)
        return reader.readInt32();
      else if (immediateSizeBytes === 8) {
        // FIXME
        trace("i64 not implemented; skipping 4 high-order bytes");
        reader.skip(4);
        return reader.readInt32();
      }
    }
  };

  // HACK
  var decodeDepth = 1;

  const emptyArray = [];

  // TODO: Nonrecursive
  function decodeSpecial (reader: Stream.ValueReader, handler: IDecodeHandler, stack: Wasm.Opcode[], immediates, opcode: Wasm.Opcode, specialType: Wasm.OpcodeInfo.SpecialArgType) : int32 {    
    trace("decode special " + specialType);

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

        trace("special argument count " + signature.numArguments);
        for (var i = 0; i < signature.numArguments; i++)
          decodeNode(reader, handler, stack);

        if (stack.pop() !== opcode)
          throw new Error("Decode stack misalignment");

        immediates.push(signatureIndex);

        return signature.numArguments;

      case Wasm.OpcodeInfo.SpecialArgType.Block:
        // FIXME: LEB128?
        // FIXME: eof handling
        var numChildren = <int32>reader.readByte();

        stack.push(opcode);

        trace("block containing " + numChildren + " nodes");
        for (var i = 0; i < numChildren; i++)
          decodeNode(reader, handler, stack);

        if (stack.pop() !== opcode)
          throw new Error("Decode stack misalignment");

        return numChildren;
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

    var indent = "";
    for (var i = 0; i < decodeDepth; i++)
      indent += " ";

    trace(
      indent + "opcode@" + 
      (reader.startOffset + reader.position) + "/" + 
      (reader.startOffset + reader.length) + " = 0x" + 
      b.toString(16) + "(" + Wasm.OpcodeInfo.getName(opcode) + ")"
    );
    var signature = Wasm.OpcodeInfo.getSignature(opcode);
    var childNodesDecoded = 0;
    var hasFiredBegin = false;
    // FIXME: Reuse
    var immediates = [];

    decodeDepth += 1;

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

    decodeDepth -= 1;

    handler.onOpcode(opcode, childNodesDecoded, immediates || emptyArray, stack);

    return result;
  }

  // Expects a subreader containing only the function body
  export function decodeFunctionBody (reader: Stream.ValueReader, handler: IDecodeHandler) : int32 {
    var numOpcodesRead = 0, b;
    var stack = [];
    var ok = false;

    trace("decode function body of length " + reader.length);

    try {
      while (!reader.eof && !reader.hasOverread) {
        numOpcodesRead += decodeNode(reader, handler, stack);
      }

      ok = true;
    } finally {
      if (!ok)
        trace(
          "error at opcode #" + numOpcodesRead + 
          ", byte offset #" + (reader.startOffset + reader.position)
        );
    }

    return numOpcodesRead;
  };
}