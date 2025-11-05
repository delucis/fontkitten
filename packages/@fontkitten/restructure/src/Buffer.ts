import {Base} from './Base';
import {Number as NumberT} from './Number';
import {resolveLength} from './utils';

export class BufferT extends Base<Uint8Array> {
  #length: number | NumberT | string | ((this: any, parent?: any) => number);

  constructor(length: number | NumberT | string | ((this: any, parent?: any) => number)) {
    super();
    this.#length = length;
  }
  
  decode(stream: any, parent?: any): Uint8Array {
    const length = resolveLength(this.#length, stream, parent);
    return stream.readBuffer(length);
  }
}

export {BufferT as Buffer};
