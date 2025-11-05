import {Struct} from './Struct.js';
import {ResType} from './Base.js';

const getPath = (object: any, pathArray: string[]) => {
  return pathArray.reduce((prevObj: any, key: string) => prevObj && prevObj[key], object);
};

type VersionMap = Record<string | number, Record<string, ResType<any, any> | VersionedStruct>> & {
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
}
