/// <reference path="third_party/types.ts" />
/// <reference path="third_party/stream.ts" />

module AstDecoder {
  type ValueReader = Stream.ValueReader;

  export interface IDecodeHandler {
    onBeginNode (name: string);
    onEndNode (name: string);
  }; 
}