/// <reference path="types.ts" />
/// <reference path="encoding.ts" />
/// <reference path="leb.ts" />

module Stream {
  export class ValueReader {
    bytes: Uint8Array;
    byteReader: Encoding.IElementReader;

    scratchBytes: Uint8Array;
    scratchU32:   Uint32Array;
    scratchI32:   Int32Array;
    scratchF64:   Float64Array;

    constructor (bytes: Uint8Array, index?: int32, count?: int32) {
      if (typeof (index) !== "number")
        index = 0;
      if (typeof (count) !== "number")
        count = bytes.length;

      this.bytes         = bytes;
      this.byteReader    = Encoding.makeByteReader(bytes, index, count);
      this.scratchBytes  = new Uint8Array  (128);
      this.scratchU32    = new Uint32Array (this.scratchBytes.buffer);
      this.scratchI32    = new Int32Array  (this.scratchBytes.buffer);
      this.scratchF64    = new Float64Array(this.scratchBytes.buffer);
    }

    peekByte (offset : int32) {
      return this.byteReader.peek(offset);
    }

    readByte () {
      return this.byteReader.read();
    }

    readBytes (bufferOrCount : Uint8Array | int32, offset? : int32, count? : number) : (Uint8Array | boolean) {
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

    readScratchBytes (count: int32) {
      return this.readBytes(this.scratchBytes, 0, count);
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