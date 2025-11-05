import {DecodeStream} from './DecodeStream.js';
import {Base} from './Base.js';

class NumberT extends Base {
  constructor(type, endian = 'BE') {
    super();
    this.type = type;
    this.endian = endian;
    this.fn = this.type;
    if (this.type[this.type.length - 1] !== '8') {
      this.fn += this.endian;
    }
  }

  size() {
    return DecodeStream.TYPES[this.type];
  }

  decode(stream) {
    return stream[`read${this.fn}`]();
  }

  encode(stream, val) {
    return stream[`write${this.fn}`](val);
  }
}

export {NumberT as Number};

export const uint8 = new NumberT('UInt8');
export const uint16 = new NumberT('UInt16', 'BE');
export const uint24 = new NumberT('UInt24', 'BE');
export const uint32 = new NumberT('UInt32', 'BE');
export const int8 = new NumberT('Int8');
export const int16 = new NumberT('Int16', 'BE');
export const int24 = new NumberT('Int24', 'BE');
export const int32 = new NumberT('Int32', 'BE');
export const float = new NumberT('Float', 'BE');
export const double = new NumberT('Double', 'BE');

export class Fixed extends NumberT {
  constructor(size, endian, fracBits = size >> 1) {
    super(`Int${size}`, endian);
    this._point = 1 << fracBits;
  }

  decode(stream) {
    return super.decode(stream) / this._point;
  }

  encode(stream, val) {
    return super.encode(stream, (val * this._point) | 0);
  }
}

export const fixed16 = new Fixed(16, 'BE');
export const fixed32 = new Fixed(32, 'BE');
