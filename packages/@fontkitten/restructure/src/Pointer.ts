import * as utils from './utils.js';
import {Base, ResType} from './Base.js';

type PointerOptions<P = any> = {
  type?: 'local' | 'immediate' | 'parent' | 'global';
  allowNull?: boolean;
  nullValue?: number;
  lazy?: boolean;
  relativeTo?: (ctx: any) => number;
};

export class Pointer<T = unknown> extends Base<T | null | number | utils.PropertyDescriptor> {
  offsetType: ResType<number, any>;
  type: ResType<T, any> | null;
  options: PointerOptions;
  private relativeToGetter?: (ctx: any) => number;

  constructor(offsetType: ResType<number, any>, type: ResType<T, any> | 'void' | null, options: PointerOptions = {}) {
    super();
    this.offsetType = offsetType;
    this.type = type === 'void' ? null : type;
    this.options = options;
    if (this.options.type == null) { this.options.type = 'local'; }
    if (this.options.allowNull == null) { this.options.allowNull = true; }
    if (this.options.nullValue == null) { this.options.nullValue = 0; }
    if (this.options.lazy == null) { this.options.lazy = false; }
    if (this.options.relativeTo) {
      if (typeof this.options.relativeTo !== 'function') {
        throw new Error('relativeTo option must be a function');
      }
      this.relativeToGetter = options.relativeTo;
    }
  }

  decode(stream: any, ctx: any): T | null | number | utils.PropertyDescriptor {
    const offset = this.offsetType.decode(stream, ctx);

    // handle NULL pointers
    if ((offset === this.options.nullValue) && this.options.allowNull) {
      return null;
    }

    let relative: number;
    switch (this.options.type) {
      case 'local':     relative = ctx._startOffset; break;
      case 'immediate': relative = stream.pos - this.offsetType.size(); break;
      case 'parent':    relative = ctx.parent._startOffset; break;
      default:
        var c = ctx;
        while (c.parent) {
          c = c.parent;
        }

        relative = c._startOffset || 0;
    }

    if (this.options.relativeTo) {
      relative += this.relativeToGetter!(ctx);
    }

    const ptr = offset + relative;

    if (this.type != null) {
      let val: T | null = null;
      const decodeValue = () => {
        if (val != null) { return val; }

        const { pos } = stream;
        stream.pos = ptr;
        val = this.type!.decode(stream, ctx);
        stream.pos = pos;
        return val;
      };

      // If this is a lazy pointer, define a getter to decode only when needed.
      // This obviously only works when the pointer is contained by a Struct.
      if (this.options.lazy) {
        return new utils.PropertyDescriptor({
          get: decodeValue});
      }

      return decodeValue();
    } else {
      return ptr;
    }
  }

  size(val: any, ctx: any): number {
    const parent = ctx;
    switch (this.options.type) {
      case 'local': case 'immediate':
        break;
      case 'parent':
        ctx = ctx.parent;
        break;
      default: // global
        while (ctx.parent) {
          ctx = ctx.parent;
        }
    }

    let { type } = this;
    if (type == null) {
      if (!(val instanceof VoidPointer)) {
        throw new Error("Must be a VoidPointer");
      }

      ({ type } = val);
      val = val.value;
    }

    if (val && ctx) {
      // Must be written as two separate lines rather than += in case `type.size` mutates ctx.pointerSize.
      let size = type.size(val, parent);
      ctx.pointerSize += size;
    }

  return this.offsetType.size(null, ctx);
  }

  // encode(stream: any, val: any, ctx: any): void {
  //   let relative: number;
  //   const parent = ctx;
  //   if ((val == null)) {
  //     this.offsetType.encode(stream, this.options.nullValue!);
  //     return;
  //   }

  //   switch (this.options.type) {
  //     case 'local':
  //       relative = ctx.startOffset;
  //       break;
  //     case 'immediate':
  //       relative = stream.pos + this.offsetType.size(val, parent);
  //       break;
  //     case 'parent':
  //       ctx = ctx.parent;
  //       relative = ctx.startOffset;
  //       break;
  //     default: // global
  //       relative = 0;
  //       while (ctx.parent) {
  //         ctx = ctx.parent;
  //       }
  //   }

  //   if (this.options.relativeTo) {
  //     relative += this.relativeToGetter!(parent.val);
  //   }

  //   this.offsetType.encode(stream, ctx.pointerOffset - relative);

  //   let { type } = this;
  //   if (type == null) {
  //     if (!(val instanceof VoidPointer)) {
  //       throw new Error("Must be a VoidPointer");
  //     }

  //     ({ type } = val);
  //     val = val.value;
  //   }

  //   ctx.pointers.push({
  //     type,
  //     val,
  //     parent
  //   });

  //   return ctx.pointerOffset += type.size(val, parent);
  // }
}

// A pointer whose type is determined at decode time
export class VoidPointer<T = unknown> {
  type: ResType<T, any>;
  value: T;
  constructor(type: ResType<T, any>, value: T) {
    this.type = type;
    this.value = value;
  }
}
