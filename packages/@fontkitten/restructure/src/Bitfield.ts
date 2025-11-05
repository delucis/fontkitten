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
}
