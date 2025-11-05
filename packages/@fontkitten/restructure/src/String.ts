import {Base} from './Base.js';
import {Number as NumberT} from './Number.js';
import * as utils from './utils.js';

type Encoding = 'ascii' | 'utf8' | 'utf16le' | 'utf16-le' | 'utf-16be' | 'utf-16le' | 'utf16be' | 'utf16-be' | 'ucs2';

class StringT extends Base<string | Uint8Array> {
  length: number | NumberT | string | ((this: any, parent?: any) => number);
  encoding: Encoding | ((this: any, parent: any) => Encoding | undefined);

  constructor(length: number | NumberT | string | ((this: any, parent?: any) => number), encoding: Encoding | ((this: any, parent: any) => Encoding | undefined) = 'ascii') {
    super();
    this.length = length;
    this.encoding = encoding;
  }

  decode(stream: any, parent?: any): string | Uint8Array {
    let length: number, pos: number;

    let { encoding } = this;
    if (typeof encoding === 'function') {
      encoding = encoding.call(parent, parent) || 'ascii';
    }
    const width = encodingWidth(encoding);

    // if (this.length != null) {
      length = utils.resolveLength(this.length, stream, parent);
    // } else {
    //   let buffer: Uint8Array;
    //   ({buffer, length, pos} = stream);

    //   while ((pos < length - width + 1) &&
    //     (buffer[pos] !== 0x00 ||
    //     (width === 2 && buffer[pos+1] !== 0x00)
    //     )) {
    //     pos += width;
    //   }

    //   length = pos - stream.pos;
    // }

    const string = stream.readString(length, encoding);

    if ((this.length == null) && (stream.pos < stream.length)) {
      stream.pos+=width;
    }

    return string;
  }

  // size(val: string | null | undefined, parent?: any): number {
  //   // Use the defined value if no value was given
  //   if (val === undefined || val === null) {
  //     return utils.resolveLength(this.length, null, parent);
  //   }

  //   let { encoding } = this;
  //   if (typeof encoding === 'function') {
  //     encoding = encoding.call(parent != null ? parent.val : undefined, parent != null ? parent.val : undefined) || 'ascii';
  //   }

  //   if (encoding === 'utf16be') {
  //     encoding = 'utf16le';
  //   }

  //   let size = byteLength(val, encoding);
  //   if (this.length instanceof NumberT) {
  //     size += this.length.size();
  //   }

  //   if ((this.length == null)) {
  //     size += encodingWidth(encoding);
  //   }

  //   return size;
  // }

  // encode(stream: any, val: string, parent?: any): any {
  //   let { encoding } = this;
  //   if (typeof encoding === 'function') {
  //     encoding = encoding.call(parent != null ? parent.val : undefined, parent != null ? parent.val : undefined) || 'ascii';
  //   }

  //   if (this.length instanceof NumberT) {
  //     this.length.encode(stream, byteLength(val, encoding));
  //   }

  //   stream.writeString(val, encoding);

  //   if ((this.length == null)) {
  //     return encodingWidth(encoding) == 2 ?
  //       stream.writeUInt16LE(0x0000) :
  //       stream.writeUInt8(0x00);
  //   }
  // }
}

function encodingWidth(encoding: string): number {
  switch(encoding) {
    case 'ascii':
    case 'utf8': // utf8 is a byte-based encoding for zero-term string
      return 1;
    case 'utf16le':
    case 'utf16-le':
    case 'utf-16be':
    case 'utf-16le':
    case 'utf16be':
    case 'utf16-be':
    case 'ucs2':
      return 2;
    default:
      //TODO: assume all other encodings are 1-byters
      //throw new Error('Unknown encoding ' + encoding);
      return 1;
  }
}

// function byteLength(string: string, encoding: string): number {
//   switch (encoding) {
//     case 'ascii':
//       return string.length;
//     case 'utf8':
//       let len = 0;
//       for (let i = 0; i < string.length; i++) {
//         let c = string.charCodeAt(i);

//         if (c >= 0xd800 && c <= 0xdbff && i < string.length - 1) {
//           let c2 = string.charCodeAt(++i);
//           if ((c2 & 0xfc00) === 0xdc00) {
//             c = ((c & 0x3ff) << 10) + (c2 & 0x3ff) + 0x10000;
//           } else {
//             // unmatched surrogate.
//             i--;
//           }
//         }

//         if ((c & 0xffffff80) === 0) {
//           len++;
//         } else if ((c & 0xfffff800) === 0) {
//           len += 2;
//         } else if ((c & 0xffff0000) === 0) {
//           len += 3;
//         } else if ((c & 0xffe00000) === 0) {
//           len += 4;
//         }
//       }
//       return len;
//     case 'utf16le':
//     case 'utf16-le':
//     case 'utf16be':
//     case 'utf16-be':
//     case 'ucs2':
//       return string.length * 2;
//     default:
//       throw new Error('Unknown encoding ' + encoding);
//   }
// }

export {StringT as String};
