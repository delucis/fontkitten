import type { Structure } from './types';
import type { DecodeStream } from './DecodeStream';

export class Bitfield implements Structure<Record<string, boolean>> {
  #type: Structure<number, any>;
  #flags: (string | null | undefined)[];

  constructor(type: Structure<number, any>, flags: (string | null | undefined)[] = []) {
    this.#type = type;
    this.#flags = flags;
  }

  decode(stream: DecodeStream): Record<string, boolean> {
    const val = this.#type.decode(stream);

    const res: Record<string, boolean> = {};
    for (let i = 0; i < this.#flags.length; i++) {
      const flag = this.#flags[i];
      if (flag != null) {
        res[flag] = !!(val & (1 << i));
      }
    }

    return res;
  }
}
