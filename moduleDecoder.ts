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
  type ValueReader = Stream.ValueReader;

  export interface IDecodeHandler {
    onMemory (minSizeLog2: uint32, maxSizeLog2: uint32, externallyVisible: boolean);
    onSignature (numArguments: uint32, resultType: WasmTypeId);
    onFunction (flags: byte, signatureIndex: uint32, nameOffset: uint32, bodyOffset: uint32, bodySize: uint32);
    onEndOfModule ();
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

  function eof (offset) {
    throw new Error("Unexpected end of file at offset " + offset + " in stream");
  }

  function decodeFunctionSection (reader: ValueReader, handler: IDecodeHandler) {
    // FIXME: What types are these values? Varuint? Varint?
    var count = reader.readVarUint32();
    if (count === false)
      eof(reader.position);

    for (var i = 0; i < count; i++) {
      var flags = reader.readByte();
      var signatureIndex = reader.readUint16();
      var nameOffset = reader.readUint32();
      var bodySize = reader.readUint16();
      var bodyOffset = reader.position;

      if (reader.hasOverread)
        eof(reader.position);

      reader.skip(<uint16>bodySize);

      handler.onFunction(
        <byte>flags, <uint16>signatureIndex, <uint32>nameOffset, <uint32>bodyOffset, <uint32>bodySize
      );
    }
  };

  function decodeSignatureSection (reader: ValueReader, handler: IDecodeHandler) {
    // FIXME: What types are these values? Varuint? Varint?
    var count = reader.readVarUint32();
    if (count === false)
      eof(reader.position);

    for (var i = 0; i < count; i++) {
      var numArguments = reader.readByte();
      var resultType = reader.readByte();

      if (reader.hasOverread)
        eof(reader.position);

      handler.onSignature(<int32>numArguments, <int32>resultType);
    }
  };

  function decodeMemorySection (reader: ValueReader, handler: IDecodeHandler) {
    var minSize = reader.readByte();
    var maxSize = reader.readByte();
    var visibility = reader.readByte();

    if (reader.hasOverread)
      eof(reader.position);

    handler.onMemory(<byte>minSize, <byte>maxSize, !!visibility);
  };

  export function decodeModule (reader: ValueReader, handler: IDecodeHandler) {
    var sectionTypeToken;
    var numSectionsDecoded = 0;

    while ((sectionTypeToken = reader.readByte()) !== false) {
      var sectionType = <Section>sectionTypeToken;

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
          throw new Error("Section type not implemented: " + sectionTypeToken);
      }

      numSectionsDecoded += 1;
    }

    return numSectionsDecoded;
  };
}