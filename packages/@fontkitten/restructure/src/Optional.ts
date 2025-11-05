import {Base, ResType} from './Base';

export class Optional<T = unknown> extends Base<T | undefined> {
  #type: ResType<T, any>;
  #condition: boolean | ((this: any, parent?: any) => boolean);

  constructor(type: ResType<T, any>, condition: boolean | ((this: any, parent?: any) => boolean) = true) {
    super();
    this.#type = type;
    this.#condition = condition;
  }

  decode(stream: any, parent?: any): T | undefined {
    const condition = typeof this.#condition === 'function'
      ? this.#condition.call(parent, parent)
      : this.#condition;

    if (condition) {
      return this.#type.decode(stream, parent);
    }
  }
}
