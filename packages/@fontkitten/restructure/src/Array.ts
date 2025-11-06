import type { Structure, SizedStructure } from './types';
import type { DecodeStream } from './DecodeStream';
import {Number as NumberT} from './Number';
import {resolveLength} from './utils';

type LengthType = 'count' | 'bytes';

class ArrayT<T = unknown, R = T[]> implements Structure<R> {
  #lengthType: LengthType;

  constructor(
    protected type: Structure<T,any> | SizedStructure<T, any>,
    protected length: number | NumberT | string | ((this: any, parent?: any) => number),
    lengthType: LengthType = 'count'
  ) {
    this.#lengthType = lengthType;
  }

  decode(stream: DecodeStream, parent?: any): any {
    let length: number | undefined;
    const { pos } = stream;

    const res: T[] = [];
    let ctx: any = parent;

    if (this.length != null) {
      length = resolveLength(this.length, stream, parent);
    }

    if (this.length instanceof NumberT) {
      // define hidden properties
      Object.defineProperties(res, {
        parent:         { value: parent },
        _startOffset:   { value: pos },
        _currentOffset: { value: 0, writable: true },
        _length:        { value: length }
      });

      ctx = res;
    }

    if ((length == null) || (this.#lengthType === 'bytes')) {
      const target = (length != null) ?
        stream.pos + length
      : (parent != null ? parent._length : undefined) ?
        parent._startOffset + parent._length
      : stream.length;

      while (stream.pos < target) {
        res.push(this.type.decode(stream, ctx));
      }

    } else {
      for (let i = 0, end = length; i < end; i++) {
        res.push(this.type.decode(stream, ctx));
      }
    }

    return res;
  }
}

export {ArrayT as Array};
