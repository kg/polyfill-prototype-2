/// <reference path="third_party/types.ts" />
/// <reference path="third_party/stream.ts" />

type ValueReader = Stream.ValueReader;

type WasmTypeId = int32;

module V8NativeDecoder {
  export interface IDecodeHandler {
    onMemory (minSizeLog2 : int32, maxSizeLog2 : int32, externallyVisible : boolean);
    onSignature (numArguments : int32, resultType : WasmTypeId);
    onFunction (nameOffset : int32, signatureIndex : int32, bodyOffset : int32);
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

  function eof () {
    throw new Error("Unexpected end of file");
  }

  export function decodeFunctionSection (reader: ValueReader, handler: IDecodeHandler) {
  };

  export function decodeSignatureSection (reader: ValueReader, handler: IDecodeHandler) {
    // FIXME: What types are these values? Varuint? Varint?
    var count = reader.readVarUint32();
    if (count === false)
      eof();

    for (var i = 0; i < count; i++) {
      var numArguments = reader.readVarUint32();
      var resultType = reader.readByte();

      if (reader.hasOverread)
        eof();

      handler.onSignature(<int32>numArguments, <int32>resultType);
    }
  };

  export function decodeMemorySection (reader: ValueReader, handler: IDecodeHandler) {
    var minSize = reader.readByte();
    var maxSize = reader.readByte();
    var visibility = reader.readByte();

    if (reader.hasOverread)
      eof();

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
          return numSectionsDecoded;

        default:
          throw new Error("Section type not implemented: " + sectionTypeToken);
      }

      numSectionsDecoded += 1;
    }

    return numSectionsDecoded;
  };
}