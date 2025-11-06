import {Struct, type StructFields} from './Struct';
import type { Structure } from './types';
import type { DecodeStream } from './DecodeStream';

const getPath = (object: any, pathArray: string[]) => {
  return pathArray.reduce((prevObj: any, key: string) => prevObj && prevObj[key], object);
};

type VersionMap = Record<number, StructFields> & {
  header?: Record<string, Structure<any, any>>
};
type WithVersion<T> = T & { version: number };

export class VersionedStruct<R extends VersionMap = any> extends Struct<R[number]> {
  #type: string | Structure<number, any>;
  #versionPath?: string[];

  constructor(type: string | Structure<number, any>, public versions: R) {
    super();
    this.#type = type;
    if (typeof type === 'string') {
      this.#versionPath = type.split('.');
    }
  }

  decode(stream: DecodeStream, parent?: any, length: number = 0): WithVersion<R[number]> {
    const res = this._setup(stream, parent, length) as WithVersion<R[number]>;

    if (typeof this.#type === 'string') {
      res.version = getPath(parent, this.#versionPath!);
    } else {
      res.version = this.#type.decode(stream);
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
}
