import {Base, ResType} from './Base.js';
import * as utils from './utils.js';

export class Reserved extends Base<undefined> {
  type: ResType<number, any> | { size: () => number };
  count: number | string | ((this: any, parent?: any) => number);

  constructor(type: any, count: number | string | ((this: any, parent?: any) => number) = 1) {
    super();
    this.type = type;
    this.count = count;
  }
  decode(stream: any, parent?: any): undefined {
    stream.pos += this.size(null, parent);
    return undefined;
  }

  size(data: any, parent?: any): number {
    const count = utils.resolveLength(this.count, null, parent);
    return this.type.size() * count;
  }

  // encode(stream: any, val: undefined, parent?: any): void {
  //   return stream.fill(0, this.size(val, parent));
  // }
}
