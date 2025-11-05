import {Base, ResType} from './Base.js';

export class Optional<T = unknown> extends Base<T | undefined> {
  type: ResType<T, any>;
  condition: boolean | ((this: any, parent?: any) => boolean);

  constructor(type: ResType<T, any>, condition: boolean | ((this: any, parent?: any) => boolean) = true) {
    super();
    this.type = type;
    this.condition = condition;
  }

  decode(stream: any, parent?: any): T | undefined {
    let { condition } = this;
    if (typeof condition === 'function') {
      condition = condition.call(parent, parent);
    }

    if (condition) {
      return this.type.decode(stream, parent);
    }
  }
}
