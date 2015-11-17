/// <reference path="third_party/types.ts" />
/// <reference path="third_party/stream.ts" />

type ValueReader = Stream.ValueReader;

type WasmTypeId = int32;

module V8NativeDecoder {
  export interface IDecodeHandler {
    onMemory (minSizeLog2 : int32, maxSizeLog2 : int32, externallyVisible : boolean);
    onSignature (numArguments : int32, resultType : WasmTypeId);
    onFunction (nameOffset : int32, signatureIndex : int32, functionBodyOffset : int32);
    onEndOfModule ();
  };

  var SECTION = {
    Memory: 0x00,
    Signatures: 0x01,
    Functions: 0x02,
    Globals: 0x03,
    DataSegments: 0x04,
    FunctionTable: 0x05,
    End: 0x06
  };

  export function decodeFunctionSection (reader: ValueReader, handler: IDecodeHandler) {
  };

  export function decodeSignatureSection (reader: ValueReader, handler: IDecodeHandler) {
  };

  export function decodeMemorySection (reader: ValueReader, handler: IDecodeHandler) {
  };

  export function decodeModule (reader: ValueReader, handler: IDecodeHandler) {
    var sectionTypeToken;
    var numSectionsDecoded = 0;

    while ((sectionTypeToken = reader.readByte()) !== false) {
      switch (sectionTypeToken) {
        case SECTION.Memory:
          decodeMemorySection(reader, handler);
          break;

        case SECTION.Signatures:
          decodeSignatureSection(reader, handler);
          break;

        case SECTION.Functions:
          decodeFunctionSection(reader, handler);
          break;

        default:
          throw new Error("Section type not implemented: " + sectionTypeToken);
      }

      numSectionsDecoded += 1;
    }

    handler.onEndOfModule();
    return numSectionsDecoded;
  };
}