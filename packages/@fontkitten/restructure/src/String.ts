import type { Structure } from './types';
import type { DecodeStream } from './DecodeStream';
import type {Number as NumberT} from './Number';
import {resolveLength} from './utils';

type Encoding = 'ascii' | 'utf8' | 'utf-16be' | 'utf-16le' | 'utf16be' | 'utf16-be' | 'ucs2';

class StringT implements Structure<string> {
  #length: number | NumberT | string | ((this: any, parent?: any) => number);
  #encoding: Encoding | ((this: any, parent: any) => Encoding | undefined);

  constructor(length: number | NumberT | string | ((this: any, parent?: any) => number), encoding: Encoding | ((this: any, parent: any) => Encoding | undefined) = 'ascii') {
    this.#length = length;
    this.#encoding = encoding;
  }

  decode(stream: DecodeStream, parent?: any): string {
    const encoding = typeof this.#encoding === 'function'
      ? this.#encoding.call(parent, parent) || 'ascii'
      : this.#encoding;
    const width = encodingWidth(encoding);
    const length = resolveLength(this.#length, stream, parent);
    const string = stream.readString(length, encoding);

    if ((this.#length == null) && (stream.pos < stream.length)) {
      stream.pos+=width;
    }

    return string;
  }
}

function encodingWidth(encoding: string): number {
  switch(encoding) {
    case 'ascii':
    case 'utf8': // utf8 is a byte-based encoding for zero-term string
      return 1;
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

export {StringT as String};
