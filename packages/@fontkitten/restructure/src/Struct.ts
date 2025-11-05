import {BaseWithSize, ResType, ResTypeWithSize} from './Base';
import {PropertyDescriptor} from './utils';

type FieldValue = any;
type Fields = Record<string, ResType | ResTypeWithSize | ((this: any, self: any) => FieldValue)>;

export class Struct<R extends Record<string, any> = any> extends BaseWithSize<R> {
  #fields: Fields;

  constructor(fields: Fields = {}) {
    super();
    this.#fields = fields;
  }

  decode(stream: any, parent?: any, length: number = 0): R {
    const res = this._setup(stream, parent, length);
    this._parseFields(stream, res, this.#fields);

    if (this.process != null) {
      this.process.call(res, stream);
    }
    return res;
  }

  protected _setup(stream: any, parent: any, length: number): any {
    const res: any = {};

    // define hidden properties
    Object.defineProperties(res, {
      parent:         { value: parent },
      _startOffset:   { value: stream.pos },
      _currentOffset: { value: 0, writable: true },
      _length:        { value: length }
    });

    return res;
  }

  protected _parseFields(stream: any, res: any, fields: Fields): void {
    for (let key in fields) {
      let val: any;
      const type = fields[key];
      if (typeof type === 'function') {
        val = type.call(res, res);
      } else {
        val = type.decode(stream, res);
      }

      if (val !== undefined) {
        if (val instanceof PropertyDescriptor) {
          Object.defineProperty(res, key, val);
        } else {
          res[key] = val;
        }
      }

      res._currentOffset = stream.pos - res._startOffset;
    }

  }

  size(val: Partial<R> | null | undefined, parent?: any, includePointers: boolean = true): number {
    if (val == null) { val = {}; }
    const ctx = {
      parent,
      val,
      pointerSize: 0
    };

    let size = 0;
    for (let key in this.#fields) {
      const type = this.#fields[key];
      if (typeof type !== 'function' && 'size' in type && type.size != null) {
        size += type.size(val[key], ctx);
      }
    }

    if (includePointers) {
      size += ctx.pointerSize;
    }

    return size;
  }
}
