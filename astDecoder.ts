/// <reference path="third_party/types.ts" />
/// <reference path="third_party/stream.ts" />
/// <reference path="wasm.ts" />

module AstDecoder {
  export interface IDecodeHandler {
    onBeginNode (name: string);
    onEndNode (name: string);
  };

  export function decodeFunctionBody (reader: Stream.ValueReader, handler: IDecodeHandler) {
  }
}