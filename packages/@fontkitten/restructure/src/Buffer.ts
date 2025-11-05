import {Base} from './Base.js';
import {Number as NumberT} from './Number.js';
import * as utils from './utils.js';

export class BufferT extends Base<Uint8Array> {
  length: number | NumberT | string | ((this: any, parent?: any) => number);

  constructor(length: number | NumberT | string | ((this: any, parent?: any) => number)) {
    super();
    this.length = length;
  }
  
  decode(stream: any, parent?: any): Uint8Array {
    const length = utils.resolveLength(this.length, stream, parent);
    return stream.readBuffer(length);
  }

  size(val: Uint8Array | null | undefined, parent?: any): number {
    if (!val) {
      return utils.resolveLength(this.length, null, parent);
    }

    let len = val.length;
    if (this.length instanceof NumberT) {
      len += this.length.size();
    }

    return len;
  }

  // encode(stream: any, buf: Uint8Array, parent?: any): void {
  //   if (this.length instanceof NumberT) {
  //     this.length.encode(stream, buf.length);
  //   }

  //   return stream.writeBuffer(buf);
  // }
}

export {BufferT as Buffer};
