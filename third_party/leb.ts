/// <reference path="types.ts" />
/// <reference path="encoding.ts" />

module LEB {
  export function writeUint32 (byteWriter : Encoding.IElementWriter, value : uint32) {
    var v = value;

    var b = 0;
    value |= 0;

    do {
      b = value & 0x7F;
      value >>>= 7;
      if (value)
        b |= 0x80;

      byteWriter.write(b);
    } while (value);
  };

  export function readUint32 (byteReader : Encoding.IElementReader) : (uint32 | boolean) {
    var result = 0, shift = 0;

    while (true) {
      var elt = byteReader.read();
      if (elt === false)
        return false;

      var b = <byte>elt;
      var shifted = (b & 0x7F) << shift;
      result |= shifted;

      if ((b & 0x80) === 0)
        break;

      shift += 7;
    }

    result >>>= 0;
    return result;
  };

  export function writeInt32 (byteWriter : Encoding.IElementWriter, value : int32) {
    var v = value;

    var b = 0;
    value |= 0;

    do {
      b = value & 0x7F;
      value >>= 7;

      var signBit = (b & 0x40) !== 0;

      if (
        ((value === 0) && !signBit) ||
        ((value === -1) && signBit)
      ) {
        byteWriter.write(b);
        break;
      } else {
        b |= 0x80;
        byteWriter.write(b);
      }
    } while (true);
  };

  export function readInt32 (byteReader : Encoding.IElementReader) : (int32 | boolean) {
    var result = 0, shift = 0, b = 0;

    while (true) {
      var elt = byteReader.read();
      if (elt === false)
        return false;

      b = <byte>elt;

      var shifted = (b & 0x7F) << shift;
      result |= shifted;
      shift += 7;
      
      if ((b & 0x80) === 0)
        break;
    }

    if (b & 0x40)
      result |= (-1 << shift);

    return result;
  };
}