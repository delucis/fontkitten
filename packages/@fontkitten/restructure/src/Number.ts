import {DecodeStream} from './DecodeStream';
import type {SizedStructure} from './types';

class NumberT implements SizedStructure<number> {
  #size: number;
  #readFnName: Extract<keyof DecodeStream, `read${string}Int${string}`>;

  constructor(type: keyof typeof DecodeStream.TYPES) {
    this.#readFnName = (type === 'Int8' || type === 'UInt8') ? `read${type}` : `read${type}BE`;
    this.#size = DecodeStream.TYPES[type];
  }

  size(): number {
    return this.#size;
  }

  decode(stream: DecodeStream): number {
    return stream[this.#readFnName]();
  }
}

export {NumberT as Number};

export const uint8: NumberT = new NumberT('UInt8');
export const uint16: NumberT = new NumberT('UInt16');
export const uint24: NumberT = new NumberT('UInt24');
export const uint32: NumberT = new NumberT('UInt32');
export const int8: NumberT = new NumberT('Int8');
export const int16: NumberT = new NumberT('Int16');
export const int32: NumberT = new NumberT('Int32');

export class Fixed extends NumberT {
  #point: number;

  constructor(size: 16 | 32, fracBits: number = size >> 1) {
    super(`Int${size}`);
    this.#point = 1 << fracBits;
  }

  decode(stream: DecodeStream): number {
    return super.decode(stream) / this.#point;
  }
}

export const fixed16: Fixed = new Fixed(16);
export const fixed32: Fixed = new Fixed(32);
