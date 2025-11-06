import type { Structure } from './types';
import type { DecodeStream } from './DecodeStream';

export class Optional<T = unknown> implements Structure<T | undefined> {
  #type: Structure<T, any>;
  #condition: boolean | ((this: any, parent?: any) => boolean);

  constructor(type: Structure<T, any>, condition: boolean | ((this: any, parent?: any) => boolean) = true) {
    this.#type = type;
    this.#condition = condition;
  }

  decode(stream: DecodeStream, parent?: any): T | undefined {
    const condition = typeof this.#condition === 'function'
      ? this.#condition.call(parent, parent)
      : this.#condition;

    if (condition) {
      return this.#type.decode(stream, parent);
    }
  }
}
