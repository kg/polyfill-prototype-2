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
/// <reference path="astDecoder.ts" />

module ModuleDecoder {
  export interface IDecodeHandler {
    onMemory (minSizeLog2: uint32, maxSizeLog2: uint32, externallyVisible: boolean);

    // Array is reused, so make a copy if you want to retain it
    onSignature (resultType: WasmTypeId, argumentTypes: WasmTypeId[]);

    // Return an AST decode handler to read the function body; otherwise it'll be skipped
    onFunction (
      flags: byte, signatureIndex: uint32, nameOffset: uint32, locals: Object,
      bodyOffset: uint32, bodySize: uint32
    ) : AstDecoder.IDecodeHandler;

    onImport (
      flags: byte, signatureIndex: uint32, nameOffset: uint32
    );

    onEndOfModule ();
  };

  enum FunctionBitFlags {
    Name = 0x01,
    Import = 0x02,
    Locals = 0x04,
    Export = 0x08
  };

  export enum Section {
    Memory = 0x00,
    Signatures = 0x01,
    Functions = 0x02,
    Globals = 0x03,
    DataSegments = 0x04,
    FunctionTable = 0x05,
    End = 0x06
  };

  export enum FunctionFlags {
    Import = 0x02,
    Export = 0x08,
    ImportExport = 0xA
  };

  function eof (offset) {
    throw new Error("Unexpected end of file at offset " + offset + " in stream");
  };

  function decodeFunctionSection (reader: Stream.ValueReader, handler: IDecodeHandler) {
    // FIXME: What types are these values? Varuint? Varint?
    var count = reader.readVarUint32();
    if (count === false)
      eof(reader.position);

    for (var i = 0; i < count; i++) {
      var flags = reader.readByte();
      if (flags === false)
        eof(reader.position);

      var signatureIndex = reader.readUint16();
      if (signatureIndex === false)
        eof(reader.position);

      var maskedFlags = <byte>flags & (FunctionFlags.ImportExport);
      var hasName   = <byte>flags & FunctionBitFlags.Name;
      var isImport  = <byte>flags & FunctionBitFlags.Import;
      var hasLocals = <byte>flags & FunctionBitFlags.Locals;

      var nameOffset = null;
      var locals = null;

      if (hasName)
        nameOffset = reader.readUint32();

      if (isImport) {
        handler.onImport(
          <byte>flags, <uint32>signatureIndex, nameOffset
        );
        continue;
      }

      if (hasLocals) {
        // FIXME: Reuse
        locals = {
          i32: reader.readUint16(),
          i64: reader.readUint16(),
          f32: reader.readUint16(),
          f64: reader.readUint16()
        };
      }

      var bodySize = reader.readUint16();
      var bodyOffset = reader.position;

      if (reader.hasOverread)
        eof(reader.position);

      var astDecodeHandler = handler.onFunction(
        maskedFlags, <uint16>signatureIndex, <uint32>nameOffset, 
        locals, <uint32>bodyOffset, <uint32>bodySize
      );

      console.log("body size " + bodySize + ", body offset " + bodyOffset);
      var body : Stream.ValueReader;
      try {
        body = reader.readSubstream(<uint32>bodySize);
      } catch (innerErr) {
        var err = new Error("Error decoding body of function #" + i + ": " + String(innerErr));
        err["inner"] = err;
        throw err;
      }

      if (astDecodeHandler)
        AstDecoder.decodeFunctionBody(body, astDecodeHandler);
    }
  };

  function decodeSignatureSection (reader: Stream.ValueReader, handler: IDecodeHandler) {
    // FIXME: What types are these values? Varuint? Varint?
    var count = reader.readVarUint32();
    if (count === false)
      eof(reader.position);

    var argumentTypes = [];

    console.log("reading " + count + " signatures");

    for (var i = 0; i < count; i++) {
      var numArguments = reader.readByte();
      if (numArguments === false)
        eof(reader.position);

      var resultType = reader.readByte();

      argumentTypes.length = <uint32>numArguments;
      for (var j = 0; j < numArguments; j++)
        argumentTypes[j] = reader.readByte()

      if (reader.hasOverread)
        eof(reader.position);

      handler.onSignature(<int32>resultType, argumentTypes);
    }
  };

  function decodeMemorySection (reader: Stream.ValueReader, handler: IDecodeHandler) {
    var minSize = reader.readByte();
    var maxSize = reader.readByte();
    var visibility = reader.readByte();

    if (reader.hasOverread)
      eof(reader.position);

    handler.onMemory(<byte>minSize, <byte>maxSize, !!visibility);
  };

  export function decodeModule (reader: Stream.ValueReader, handler: IDecodeHandler) : int32 {
    var sectionTypeToken;
    var numSectionsDecoded = 0;

    while ((sectionTypeToken = reader.readByte()) !== false) {
      var sectionType = <Section>sectionTypeToken;

      console.log("//  section " + sectionType + " (" + Section[sectionTypeToken] + ")");

      switch (sectionType) {
        case Section.Memory:
          decodeMemorySection(reader, handler);
          break;

        case Section.Signatures:
          decodeSignatureSection(reader, handler);
          break;

        case Section.Functions:
          decodeFunctionSection(reader, handler);
          break;

        case Section.End:
          handler.onEndOfModule();
          return numSectionsDecoded + 1;

        default:
          throw new Error("Section type not implemented: " + sectionTypeToken + " (" + Section[sectionTypeToken] + ")");
      }

      numSectionsDecoded += 1;
    }

    return numSectionsDecoded;
  };

  export function decodeUtf8String (bytes: Uint8Array, offset: uint32) {
    var nullLocation = -1;

    for (var i = offset; i < bytes.length; i++) {
      var b = bytes[i];
      if (b === 0) {
        nullLocation = i;
        break;
      }
    }

    if (nullLocation < 0)
      eof(offset);

    return Encoding.decodeUTF8(bytes, offset, nullLocation - offset);
  };
}