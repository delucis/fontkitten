import {Array as ArrayT} from './Array';
import type { ResTypeWithSize } from './Base';
import type {DecodeStream} from './DecodeStream';
import {Number as NumberT} from './Number';
import {resolveLength} from './utils';

export class LazyArray<T = unknown> extends ArrayT<T, LazyArrayValue<T>> {
  decode(stream: DecodeStream, parent?: any): LazyArrayValue<T> {
    const { pos } = stream;
    const length = resolveLength(this.length, stream, parent);

    if (this.length instanceof NumberT) {
      parent = {
        parent,
        _startOffset: pos,
        _currentOffset: 0,
        _length: length
      };
    }

    const res = new LazyArrayValue<T>(this.type, length, stream, parent);

    stream.pos += length * this.type.size(null, parent);
    return res;
  }
}

class LazyArrayValue<T = unknown> {
  #type: ResTypeWithSize<T>;
  #stream: any;
  #ctx: any;
  #base: number;
  #items: (T | undefined)[];
  length: number;

  constructor(type: ResTypeWithSize<T>, length: number, stream: any, ctx: any) {
    this.#type = type;
    this.length = length;
    this.#stream = stream;
    this.#ctx = ctx;
    this.#base = this.#stream.pos;
    this.#items = [];
  }

  get(index: number): T | undefined {
    if ((index < 0) || (index >= this.length)) {
      return undefined;
    }

    if (this.#items[index] == null) {
      const { pos } = this.#stream;
      this.#stream.pos = this.#base + (this.#type.size(null, this.#ctx) * index);
      this.#items[index] = this.#type.decode(this.#stream, this.#ctx);
      this.#stream.pos = pos;
    }

    return this.#items[index];
  }

  toArray(): T[] {
    const result: T[] = [];
    for (let i = 0, end = this.length; i < end; i++) {
      // get() can theoretically return undefined for OOB, but index < length protects us.
      result.push(this.get(i)!);
    }
    return result;
  }
}
