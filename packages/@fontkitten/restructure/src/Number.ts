import {DecodeStream} from './DecodeStream.js';
import {Base} from './Base.js';

class NumberT extends Base<number> {
  type: keyof typeof DecodeStream.TYPES | 'UInt24' | 'Int24';
  readFnName: string;
  // writeFnName: string;

  constructor(type: string) {
    super();
    let fn = this.type = type;
    if (this.type.at(- 1) !== '8') {
      fn += 'BE';
    }
    this.readFnName = `read${fn}`;
    // this.writeFnName = `write${fn}`;
  }

  size(value?: number | null, parent?: any, includePointers?: boolean): number {
    return DecodeStream.TYPES[this.type];
  }

  decode(stream: any): number {
    return stream[this.readFnName]();
  }

  // encode(stream: any, val: number): void {
  //   return stream[this.writeFnName](val);
  // }
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
  private _point: number;

  constructor(size: 16 | 32, fracBits: number = size >> 1) {
    super(`Int${size}`);
    this._point = 1 << fracBits;
  }

  decode(stream: any): number {
    return super.decode(stream) / this._point;
  }

  encode(stream: any, val: number): void {
    return super.encode(stream, (val * this._point) | 0);
  }
}

export const fixed16: Fixed = new Fixed(16);
export const fixed32: Fixed = new Fixed(32);
