import {Base, ResType} from './Base.js';

export class Bitfield extends Base<Record<string, boolean>> {
  type: ResType<number, any>;
  flags: (string | null | undefined)[];

  constructor(type: ResType<number, any>, flags: (string | null | undefined)[] = []) {
    super();
    this.type = type;
    this.flags = flags;
  }

  decode(stream: any): Record<string, boolean> {
    const val = this.type.decode(stream);

    const res: Record<string, boolean> = {};
    for (let i = 0; i < this.flags.length; i++) {
      const flag = this.flags[i];
      if (flag != null) {
        res[flag] = !!(val & (1 << i));
      }
    }

    return res;
  }

  // size(value?: Record<string, boolean> | null, parent?: any, includePointers?: boolean): number {
  //   return this.type.size();
  // }

  // encode(stream: any, keys: Record<string, boolean>): void {
  //   let val = 0;
  //   for (let i = 0; i < this.flags.length; i++) {
  //     const flag = this.flags[i];
  //     if (flag != null) {
  //       if (keys[flag]) { val |= (1 << i); }
  //     }
  //   }

  //   return this.type.encode(stream, val);
  // }
}
