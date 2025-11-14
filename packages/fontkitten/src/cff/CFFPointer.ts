import * as r from '@fontkitten/restructure';

export default class CFFPointer extends r.Pointer {
  constructor(type, options = {}) {
    if (options.type == null) {
      options.type = 'global';
    }

    super(null, type, options);
  }

  decode(stream: r.DecodeStream, parent: any, operands: number[]): unknown {
    this.offsetType = {
      decode: () => operands[0]
    };

    return super.decode(stream, parent);
  }
}
