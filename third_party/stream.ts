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

/// <reference path="types.ts" />
/// <reference path="encoding.ts" />
/// <reference path="leb.ts" />

module Stream {
  export class ValueReader {
    bytes: Uint8Array;
    byteReader: Encoding.IElementReader;

    scratchBytes: Uint8Array;
    scratchU16:   Uint16Array;
    scratchU32:   Uint32Array;
    scratchI16:   Int16Array;
    scratchI32:   Int32Array;
    scratchF32:   Float32Array;
    scratchF64:   Float64Array;

    constructor (bytes: Uint8Array, index?: uint32, count?: uint32) {
      if (typeof (index) !== "number")
        index = 0;
      if (typeof (count) !== "number")
        count = bytes.length;

      this.bytes         = bytes;
      this.byteReader    = Encoding.makeByteReader(bytes, index, count);
      this.scratchBytes  = new Uint8Array  (128);
      this.scratchU16    = new Uint16Array (this.scratchBytes.buffer);
      this.scratchU32    = new Uint32Array (this.scratchBytes.buffer);
      this.scratchI16    = new Int16Array  (this.scratchBytes.buffer);
      this.scratchI32    = new Int32Array  (this.scratchBytes.buffer);
      this.scratchF32    = new Float32Array(this.scratchBytes.buffer);
      this.scratchF64    = new Float64Array(this.scratchBytes.buffer);
    }

    get position () : int32 {
      return this.byteReader.getPosition();
    }

    get hasOverread () : boolean {
      return this.byteReader.hasOverread;
    }

    get eof () : boolean {
      return this.byteReader.eof;
    }

    readSubstream (length: uint32) : ValueReader {
      var result = new ValueReader(
        this.bytes, this.byteReader.getPosition(), length
      );

      this.skip(length);

      return result;
    }

    peekByte (offset : int32) {
      return this.byteReader.peek(offset);
    }

    readByte () {
      return this.byteReader.read();
    }

    readBytes (bufferOrCount: Uint8Array | int32, offset?: int32, count?: number) : (Uint8Array | boolean) {
      if (arguments.length === 1) {
        count = <number>bufferOrCount | 0;
        var temp = new Uint8Array(count);
        if (this.readBytes(temp, 0, count))
          return temp;
        else
          return false;
      }

      var buffer = <Uint8Array>bufferOrCount;
      for (var i = 0; i < count; i++) {
        var b = this.byteReader.read();

        if (b === false)
          return false;

        buffer[offset + i] = <number>b;
      }

      return true;
    }

    readScratchBytes (count: int32) : (Uint8Array | boolean) {
      var read = this.readBytes(this.scratchBytes, 0, count);
      if (read === false)
        return read;
      else
        return this.scratchBytes;
    }

    readUint16 () : (uint16 | boolean) {
      if (this.readScratchBytes(2) === false)
        return false;

      return this.scratchU16[0];
    }

    readInt16 () : (int16 | boolean) {
      if (this.readScratchBytes(2) === false)
        return false;

      return this.scratchI16[0];
    }

    readUint32 () : (uint32 | boolean) {
      if (this.readScratchBytes(4) === false)
        return false;

      return this.scratchU32[0];
    }

    readInt32 () : (int32 | boolean) {
      if (this.readScratchBytes(4) === false)
        return false;

      return this.scratchI32[0];
    }

    readVarUint32 () : (uint32 | boolean) {
      return LEB.readUint32(this.byteReader);
    };

    readVarInt32 () : (int32 | boolean) {
      return LEB.readInt32(this.byteReader);
    };

    readFloat32 () : (float32 | boolean) {
      if (this.readScratchBytes(4) === false)
        return false;

      return this.scratchF32[0];
    };

    readFloat64 () : (float64 | boolean) {
      if (this.readScratchBytes(8) === false)
        return false;

      return this.scratchF64[0];
    };

    readNullTerminatedUtf8String () : string {
      var length = 0, position;

      position = this.byteReader.getPosition();
      do {
        var elt = this.readByte();
        if (elt === false)
          break;
        else if (elt === 0);
          break;

        length += 1;
      } while (true);

      return Encoding.decodeUTF8(this.bytes, position, length);
    };

    skip (distance: int32) {
      this.byteReader.skip(distance);
    }
  }
}