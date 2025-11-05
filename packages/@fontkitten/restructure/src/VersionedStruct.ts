import {Struct} from './Struct.js';
import {ResType} from './Base.js';

const getPath = (object: any, pathArray: string[]) => {
  return pathArray.reduce((prevObj: any, key: string) => prevObj && prevObj[key], object);
};

type VersionMap<V extends string | number = any> = Record<string | number, Record<string, ResType<any, any> | VersionedStruct>> & {
  header?: Record<string, ResType<any, any>>
};

export class VersionedStruct<R extends Record<string, any> = any> extends Struct<R> {
  type: string | ResType<number | string, any>;
  versions: VersionMap;
  versionPath?: string[];

  constructor(type: string | ResType<number | string, any>, versions: VersionMap = {}) {
    super();
    this.type = type;
    this.versions = versions;
    if (typeof type === 'string') {
      this.versionPath = type.split('.');
    }
  }

  decode(stream: any, parent?: any, length: number = 0): any {
    const res = this._setup(stream, parent, length);

    if (typeof this.type === 'string') {
      res.version = getPath(parent, this.versionPath!);
    } else {
      res.version = this.type.decode(stream);
    }

    if (this.versions.header) {
      this._parseFields(stream, res, this.versions.header);
    }

    const fields = this.versions[res.version];
    if ((fields == null)) {
      throw new Error(`Unknown version ${res.version}`);
    }

    if (fields instanceof VersionedStruct) {
      return fields.decode(stream, parent);
    }

    this._parseFields(stream, res, fields);

    if (this.process != null) {
      this.process.call(res, stream);
    }
    return res;
  }

  size(val: any, parent?: any, includePointers: boolean = true): number {
    let key, type;
    if (!val) {
      throw new Error('Not a fixed size');
    }

    if (this.preEncode != null) {
      this.preEncode.call(val);
    }

    const ctx: any = {
      parent,
      val,
      pointerSize: 0
    };

    let size = 0;
    if (typeof this.type !== 'string') {
      size += this.type.size(val.version, ctx);
    }

    if (this.versions.header) {
      for (key in this.versions.header) {
        type = this.versions.header[key];
        if (type.size != null) {
          size += type.size(val[key], ctx);
        }
      }
    }

    const fields = this.versions[val.version];
    if ((fields == null)) {
      throw new Error(`Unknown version ${val.version}`);
    }

    for (key in fields) {
      type = fields[key];
      if (type.size != null) {
        size += type.size(val[key], ctx);
      }
    }

    if (includePointers) {
      size += ctx.pointerSize;
    }

    return size;
  }

  // encode(stream: any, val: any, parent?: any): void {
  //   let key, type: any;
  //   if (this.preEncode != null) {
  //     this.preEncode.call(val, stream);
  //   }

  //   const ctx: any = {
  //     pointers: [] as Array<{type: any; val: any; parent: any}>,
  //     startOffset: stream.pos,
  //     parent,
  //     val,
  //     pointerSize: 0
  //   };

  //   ctx.pointerOffset = stream.pos + this.size(val, ctx, false);

  //   if (typeof this.type !== 'string') {
  //     this.type.encode(stream, val.version);
  //   }

  //   if (this.versions.header) {
  //     for (key in this.versions.header) {
  //       type = this.versions.header[key];
  //       if (type.encode != null) {
  //         type.encode(stream, val[key], ctx);
  //       }
  //     }
  //   }

  //   const fields = this.versions[val.version];
  //   for (key in fields) {
  //     type = fields[key];
  //     if (type.encode != null) {
  //       type.encode(stream, val[key], ctx);
  //     }
  //   }

  //   let i = 0;
  //   while (i < ctx.pointers.length) {
  //     const ptr = ctx.pointers[i++];
  //     ptr.type.encode(stream, ptr.val, ptr.parent);
  //   }
  // }
}
