import {PropertyDescriptor} from './utils';
import type { Structure, SizedStructure } from './types';
import type { DecodeStream } from './DecodeStream';

type PointerOptions = {
  type?: 'local' | 'parent' | 'global';
  allowNull?: boolean;
  nullValue?: number;
  lazy?: boolean;
  relativeTo?: (ctx: any) => number;
};

export class Pointer<T = unknown> implements SizedStructure<T | null | number | PropertyDescriptor> {
  #type: Structure<T, any> | SizedStructure<T, any> | null;
  #options: Required<Pick<PointerOptions, 'type' | 'allowNull' | 'nullValue' | 'lazy'>> &
    Pick<PointerOptions, 'relativeTo'>;

  constructor(public offsetType: SizedStructure<number, any>, type: Structure<T, any> | SizedStructure<T, any> | 'void' | null, options: PointerOptions = {}) {
    this.#type = type === 'void' ? null : type;
    this.#options = { type: 'local', allowNull: true, nullValue: 0, lazy: false, ...options };
  }

  decode(stream: DecodeStream, ctx: any): T | null | number | PropertyDescriptor {
    const offset = this.offsetType.decode(stream, ctx);

    // handle NULL pointers
    if ((offset === this.#options.nullValue) && this.#options.allowNull) {
      return null;
    }

    let relative: number;
    switch (this.#options.type) {
      case 'local':     relative = ctx._startOffset; break;
      case 'parent':    relative = ctx.parent._startOffset; break;
      default:
        var c = ctx;
        while (c.parent) {
          c = c.parent;
        }

        relative = c._startOffset || 0;
    }

    if (this.#options.relativeTo) {
      relative += this.#options.relativeTo(ctx);
    }

    const ptr = offset + relative;

    if (this.#type != null) {
      let val: T | null = null;
      const decodeValue = () => {
        if (val != null) { return val; }

        const { pos } = stream;
        stream.pos = ptr;
        val = this.#type!.decode(stream, ctx);
        stream.pos = pos;
        return val;
      };

      // If this is a lazy pointer, define a getter to decode only when needed.
      // This obviously only works when the pointer is contained by a Struct.
      if (this.#options.lazy) {
        return new PropertyDescriptor({
          get: decodeValue});
      }

      return decodeValue();
    } else {
      return ptr;
    }
  }

  size(val: any, ctx: any): number {
    const parent = ctx;
    switch (this.#options.type) {
      case 'local':
        break;
      case 'parent':
        ctx = ctx.parent;
        break;
      default: // global
        while (ctx.parent) {
          ctx = ctx.parent;
        }
    }

    let type = this.#type;
    if (type == null) {
      if (!(val instanceof VoidPointer)) {
        throw new Error("Must be a VoidPointer");
      }

      ({ type } = val);
      val = val.value;
    }

    if (val && ctx && 'size' in type) {
      // Must be written as two separate lines rather than += in case `type.size` mutates ctx.pointerSize.
      let size = type.size(val, parent);
      ctx.pointerSize += size;
    }

    return this.offsetType.size(null, ctx);
  }
}

// A pointer whose type is determined at decode time
export class VoidPointer<T = unknown> {
  constructor(public type: SizedStructure<T, any>, public value: T) {}
}
