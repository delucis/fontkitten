import type { SizedStructure } from './types';
import type { DecodeStream } from './DecodeStream';
import {resolveLength} from './utils';

export class Reserved implements SizedStructure<void> {
  #type: SizedStructure<number, any> | { size: () => number };
  #count: number | string | ((this: any, parent?: any) => number);

  constructor(type: any, count: number | string | ((this: any, parent?: any) => number) = 1) {
    this.#type = type;
    this.#count = count;
  }
  decode(stream: DecodeStream, parent?: any): void {
    stream.pos += this.size(null, parent);
  }

  size(data: any, parent?: any): number {
    const count = resolveLength(this.#count, null, parent);
    return this.#type.size() * count;
  }
}
