import {Base, ResType} from './Base.js';
import {Number as NumberT} from './Number.js';
import * as utils from './utils.js';

type LengthType = 'count' | 'bytes';

class ArrayT<T = unknown, R = T[]> extends Base<R> {
  type: ResType<T, any>;
  length: number | NumberT | string | ((this: any, parent?: any) => number);
  lengthType: LengthType;

  constructor(
    type: ResType<T, any>,
    length: number | NumberT | string | ((this: any, parent?: any) => number),
    lengthType: LengthType = 'count'
  ) {
    super();
    this.type = type;
    this.length = length;
    this.lengthType = lengthType;
  }

  decode(stream: any, parent?: any): any {
    let length: number | undefined;
    const { pos } = stream;

    const res: T[] = [];
    let ctx: any = parent;

    if (this.length != null) {
      length = utils.resolveLength(this.length, stream, parent);
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

    if ((length == null) || (this.lengthType === 'bytes')) {
      const target = (length != null) ?
        stream.pos + length
      : (parent != null ? parent._length : undefined) ?
        parent._startOffset + parent._length
      :
        stream.length;

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

  size(array: any, ctx: any, includePointers: boolean = true): number {
    if (!array) {
      return this.type.size(null, ctx) * utils.resolveLength(this.length, null, ctx);
    }

    let size = 0;
    if (this.length instanceof NumberT) {
      size += this.length.size();
      ctx = {parent: ctx, pointerSize: 0};
    }

    for (let item of array) {
      size += this.type.size(item, ctx);
    }

    if (ctx && includePointers && this.length instanceof NumberT) {
      size += ctx.pointerSize;
    }
    
    return size;
  }

  // encode(stream: any, array: any, parent?: any): void {
  //   let ctx: any = parent;
  //   if (this.length instanceof NumberT) {
  //     ctx = {
  //       pointers: [],
  //       startOffset: stream.pos,
  //       parent
  //     };

  //     ctx.pointerOffset = stream.pos + this.size(array, ctx, false);
  //     this.length.encode(stream, array.length);
  //   }

  //   for (let item of array) {
  //     this.type.encode(stream, item, ctx);
  //   }

  //   if (this.length instanceof NumberT) {
  //     let i = 0;
  //     while (i < ctx.pointers.length) {
  //       const ptr = ctx.pointers[i++];
  //       ptr.type.encode(stream, ptr.val, ptr.parent);
  //     }
  //   }
  // }
}

export {ArrayT as Array};
