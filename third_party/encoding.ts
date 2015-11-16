/// <reference path="types.ts" />

/// portions ganked from JSIL.Bootstrap.Text.js (see JSIL_LICENSE)
/// utf8 decode/encode partially based on tidy (see TIDY_LICENSE)
/// fromCharCode / charCodeAt based on MDN reference implementations,
///  (MIT license due to predating Aug 20, 2010), (see MDN_LICENSE)

module Encoding {
  export interface IElementReader {
    peek (offset : int32) : number | boolean;
    read () : number | boolean;
    skip (distance : int32);
    getPosition () : int32;
    eof : boolean;
  }

  export interface IElementWriter {
    write (b: number);
    getPosition () : int32;
    getResult () : any;
  }

  export function fromCharCode (codePt : charCode) : char {
    // https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/String/fromCharCode
    if (codePt > 0xFFFF) {  
      codePt -= 0x10000;  
      return String.fromCharCode(0xD800 + (codePt >> 10), 0xDC00 + (codePt & 0x3FF));  
    } else {  
      return String.fromCharCode(codePt); 
    }  
  };

  export function charCodeAt (str : string, idx : int32) : charCode | boolean {  
    // https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/String/charCodeAt

    idx = idx || 0;  
    var code = str.charCodeAt(idx);  
    var hi, low;  

    if (0xD800 <= code && code <= 0xDBFF) { 
      // High surrogate (could change last hex to 0xDB7F to treat high private surrogates as single characters)  
      hi = code;
      low = str.charCodeAt(idx+1);  
      if (isNaN(low))
        throw new Error("High surrogate not followed by low surrogate");

      return ((hi - 0xD800) * 0x400) + (low - 0xDC00) + 0x10000;  
    }

    if (0xDC00 <= code && code <= 0xDFFF) { 
      // Low surrogate  
      // We return false to allow loops to skip this iteration since should have already handled high surrogate above in the previous iteration  
      return false;  
    }  

    return code;  
  };


  /// makeByteWriter(Uint8Array buffer, offset)
  ///   getResult -> (Uint8Array view on used region of buffer)
  /// makeByteWriter()
  ///   getResult -> (Uint8Array containing written bytes)
  export function makeByteWriter (outputBytes? : Uint8Array, outputIndex? : int32) : IElementWriter {
    if (arguments.length === 2) {
      var i = outputIndex | 0;
      var count = 0;

      return {
        write: function (byte) {
          if (i >= outputBytes.length)
            throw new Error("End of buffer");

          outputBytes[i] = byte;
          i++;
          count++;
        },
        getPosition: function () {
          return count;
        },
        getResult: function () {
          return outputBytes.slice(outputIndex, outputIndex + count);
        }
      };
    } else {
      var resultBytes = new Array();

      return {
        write: function (byte) {
          resultBytes.push(byte);
        },
        getPosition: function () {
          return resultBytes.length;
        },
        getResult: function () {
          if (typeof (Uint8Array) !== "undefined")
            return new Uint8Array(resultBytes);
          else
            return resultBytes;
        }
      };
    }
  };


  export function makeByteReader (bytes : Uint8Array, index? : int32, count? : int32) : IElementReader {
    var position = (typeof(index) === "number") ? index : 0;
    var endpoint;

    if (typeof (count) === "number")
      endpoint = (position + count);
    else
      endpoint = (bytes.length - position);

    var peek = function peek (offset : int32) : number | boolean {
      offset |= 0;
      if (position + offset >= endpoint)
        return false;

      return bytes[position + offset];
    };

    var result = {
      peek: peek,
      read: function () {
        var result = peek(0);
        if (result !== false)
          position += 1;
        return result;
      },
      getPosition: function () {
        return position;
      },
      skip: function (distance : int32) {
        position += distance;
      },
      get eof () : boolean {
        return (position >= endpoint);
      }
    };

    return result;
  };


  export function makeCharacterReader (str : string) : IElementReader {
    var position = 0, length = str.length;

    var peek = function peek (offset : int32) : (number | boolean) {
      offset |= 0;
      if (position + offset >= length)
        return false;

      return charCodeAt(str, position + offset);
    };

    var result = {
      peek: peek,
      read: function () : (number | boolean) {
        var result = peek(0);
        if (result !== false)
          position += 1;
        return result;
      },
      getPosition: function () {
        return position;
      },
      skip: function (distance : int32) {
        position += distance;
      },
      get eof () : boolean {
        return (position >= length);
      }
    };

    return result;
  };


  /// encode(str, outputBytes, outputOffset) -> numBytesWritten
  /// encode(str, outputWriter) -> numBytesWritten
  /// encode(str) -> Uint8Array
  export function encodeUTF8 (string : string, output? : (IElementWriter | Uint8Array), outputIndex? : int32) {
    // http://tidy.sourceforge.net/cgi-bin/lxr/source/src/utf8.c

    var UTF8ByteSwapNotAChar = 0xFFFE;
    var UTF8NotAChar         = 0xFFFF;

    var writer : IElementWriter;
    if ((arguments.length === 3) && output["buffer"]) {
      writer = makeByteWriter(<Uint8Array>output, outputIndex);
    } else if (arguments.length === 2) {
      if (output && output["write"] && output["getResult"])
        writer = <IElementWriter>output;
      else
        throw new Error("Expected 2nd arg to be a writer");
    } else if (arguments.length === 1) {
      writer = makeByteWriter();
    }

    if (typeof (string) !== "string")
      throw new Error("String expected");
    else if (!writer)
      throw new Error("No writer available");

    var reader = makeCharacterReader(string), ch;

    var hasError = false;

    while (!reader.eof) {
      ch = reader.read();

      if (ch === false)
        continue;

      if (ch <= 0x7F) {
        writer.write( ch );
      } else if (ch <= 0x7FF) {
        writer.write( 0xC0 | (ch >> 6) );
        writer.write( 0x80 | (ch & 0x3F) );
      } else if (ch <= 0xFFFF) {
        writer.write( 0xE0 | (ch >> 12) );
        writer.write( 0x80 | ((ch >> 6) & 0x3F) );
        writer.write( 0x80 | (ch & 0x3F) );
      } else if (ch <= 0x1FFFF) {
        writer.write( 0xF0 | (ch >> 18) );
        writer.write( 0x80 | ((ch >> 12) & 0x3F) );
        writer.write( 0x80 | ((ch >> 6) & 0x3F) );
        writer.write( 0x80 | (ch & 0x3F) );

        if ((ch === UTF8ByteSwapNotAChar) || (ch === UTF8NotAChar))
          hasError = true;
      } else if (ch <= 0x3FFFFFF) {
        writer.write( 0xF0 | (ch >> 24) );
        writer.write( 0x80 | ((ch >> 18) & 0x3F) );
        writer.write( 0x80 | ((ch >> 12) & 0x3F) );
        writer.write( 0x80 | ((ch >> 6) & 0x3F) );
        writer.write( 0x80 | (ch & 0x3F) );

        hasError = true;
      } else if (ch <= 0x7FFFFFFF) {
        writer.write( 0xF0 | (ch >> 30) );
        writer.write( 0x80 | ((ch >> 24) & 0x3F) );
        writer.write( 0x80 | ((ch >> 18) & 0x3F) );
        writer.write( 0x80 | ((ch >> 12) & 0x3F) );
        writer.write( 0x80 | ((ch >> 6) & 0x3F) );
        writer.write( 0x80 | (ch & 0x3F) );

        hasError = true;
      } else {
        hasError = true;
      }
    }

    return writer.getResult();
  };


  export function decodeUTF8 (bytes : Uint8Array, index : int32, count : int32) : string {
    // http://tidy.sourceforge.net/cgi-bin/lxr/source/src/utf8.c

    var UTF8ByteSwapNotAChar = 0xFFFE;
    var UTF8NotAChar         = 0xFFFF;

    var reader = makeByteReader(bytes, index, count), firstByte;
    var result = "";

    while (!reader.eof) {
      var accumulator = 0, extraBytes = 0, hasError = false;
      firstByte = reader.read();

      if (firstByte === false)
        continue;

      if (firstByte <= 0x7F) {
        accumulator = firstByte;
      } else if ((firstByte & 0xE0) === 0xC0) {
        accumulator = firstByte & 31;
        extraBytes = 1;
      } else if ((firstByte & 0xF0) === 0xE0) {
        accumulator = firstByte & 15;
        extraBytes = 2;
      } else if ((firstByte & 0xF8) === 0xF0) {
        accumulator = firstByte & 7;
        extraBytes = 3;
      } else if ((firstByte & 0xFC) === 0xF8) {
        accumulator = firstByte & 3;
        extraBytes = 4;
        hasError = true;
      } else if ((firstByte & 0xFE) === 0xFC) {
        accumulator = firstByte & 3;
        extraBytes = 5;
        hasError = true;
      } else {
        accumulator = firstByte;
        hasError = false;
      }

      while (extraBytes > 0) {
        var extraByte = reader.read();        
        extraBytes--;        

        if (extraByte === false) {
          hasError = true;
          break;
        }

        if ((<number>extraByte & 0xC0) !== 0x80) {
          hasError = true;
          break;
        }

        accumulator = (accumulator << 6) | (<number>extraByte & 0x3F);
      }

      if ((accumulator === UTF8ByteSwapNotAChar) || (accumulator === UTF8NotAChar))
        hasError = true;

      var characters;
      if (!hasError)
        characters = fromCharCode(accumulator);

      if (hasError || (characters === false)) {
        throw new Error("Invalid character in UTF8 text");
      } else
        result += characters;
    }

    return result;
  };

}