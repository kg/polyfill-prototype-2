'use strict';

function ValueReader (bytes, index, count) {
  this.bytes         = bytes;
  this.byteReader    = encoding.makeByteReader(bytes, index, count);
  this.scratchBytes  = new Uint8Array  (128);
  this.scratchU32    = new Uint32Array (this.scratchBytes.buffer);
  this.scratchI32    = new Int32Array  (this.scratchBytes.buffer);
  this.scratchF64    = new Float64Array(this.scratchBytes.buffer);
}

ValueReader.prototype.peekByte = function (offset) {
  return this.byteReader.peek(offset);
};

ValueReader.prototype.readByte = function () {
  var result = this.byteReader.read();

  return result;
};

ValueReader.prototype.readBytes = function (buffer, offset, count) {
  if (arguments.length === 1) {
    var temp = new Uint8Array(buffer | 0);
    if (this.readBytes(temp, 0, buffer | 0))
      return temp;
    else
      return false;
  }

  for (var i = 0; i < count; i++) {
    var b = this.byteReader.read();

    if (b === false)
      return false;

    buffer[offset + i] = b;
  }

  return true;
};

ValueReader.prototype.readScratchBytes = function (count) {
  return this.readBytes(this.scratchBytes, 0, count);
};

ValueReader.prototype.readUint32 = function () {
  var b1 = this.byteReader.peek(0),
      b2 = this.byteReader.peek(1),
      b3 = this.byteReader.peek(2);

  if (!this.readScratchBytes(4))
    return false;

  var result = this.scratchU32[0];
  return result;
};

ValueReader.prototype.readInt32 = function () {
  if (!this.readScratchBytes(4))
    return false;

  var result = this.scratchI32[0];
  return result;
};

ValueReader.prototype.readVarUint32 = function () {
  var result = common.readLEBUint32(this.byteReader);
  return result;
};

ValueReader.prototype.readVarInt32 = function () {
  var result = common.readLEBInt32(this.byteReader);
  return result;
};

ValueReader.prototype.readIndex = function () {
  var indexRaw = this.readVarUint32();

  if (indexRaw === 0)
    return 0xFFFFFFFF;
  else
    return indexRaw - 1;
};

ValueReader.prototype.readFloat64 = function () {
  if (!this.readScratchBytes(8))
    return false;

  var result = this.scratchF64[0];
  return result;
};

ValueReader.prototype.readUtf8String = function () {
  var length = 0, position;
  var b;

  position = this.byteReader.getPosition();
  while (Number(b = this.readByte()) > 0)
    length++;

  var result = encoding.UTF8.decode(this.bytes, position, length);
  return result;
};

ValueReader.prototype.readSubstream = function () {
  var length = this.readUint32();

  var result = new ValueReader(this.bytes, this.byteReader.getPosition(), length);

  this.byteReader.skip(length);

  var length2 = this.readUint32();
  if (length2 !== length)
    throw new Error("Length footer didn't match length header");

  return result;
};

ValueReader.prototype.skip = function (distance) {
  this.byteReader.skip(distance);
};
