import * as r from '@fontkitten/restructure';

export default class CFFIndex {
  constructor(public type?: any) {}

  getCFFVersion(ctx) {
    while (ctx && !ctx.hdrSize) {
      ctx = ctx.parent;
    }

    return ctx?.version ?? -1;
  }

  decode(stream: r.DecodeStream, parent: any): any[] {
    const version = this.getCFFVersion(parent);
    const count = version >= 2
      ? stream.readUInt32BE()
      : stream.readUInt16BE();

    if (count === 0) {
      return [];
    }

    const offSize = stream.readUInt8();
    let offsetType;
    if (offSize === 1) {
      offsetType = r.uint8;
    } else if (offSize === 2) {
      offsetType = r.uint16;
    } else if (offSize === 3) {
      offsetType = r.uint24;
    } else if (offSize === 4) {
      offsetType = r.uint32;
    } else {
      throw new Error(`Bad offset size in CFFIndex: ${offSize} ${stream.pos}`);
    }

    const ret: any[] = [];
    const startPos = stream.pos + ((count + 1) * offSize) - 1;

    let start = offsetType.decode(stream);
    for (let i = 0; i < count; i++) {
      const end = offsetType.decode(stream);

      if (this.type != null) {
        const { pos } = stream;
        stream.pos = startPos + start;

        parent.length = end - start;
        ret.push(this.type.decode(stream, parent));
        stream.pos = pos;
      } else {
        ret.push({
          offset: startPos + start,
          length: end - start
        });
      }

      start = end;
    }

    stream.pos = startPos + start;
    return ret;
  }
}
