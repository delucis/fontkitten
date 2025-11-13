import * as r from '@fontkitten/restructure';
import TTFFont from './TTFFont';
import type { Font, FontCollection } from './types';

const DFontName = new r.String(r.uint8);

const Ref = new r.Struct({
  id: r.uint16,
  nameOffset: r.int16,
  attr: r.uint8,
  dataOffset: r.uint24,
  handle: r.uint32
});

const Type = new r.Struct({
  name: new r.String(4),
  maxTypeIndex: r.uint16,
  refList: new r.Pointer(r.uint16, new r.Array(Ref, t => t.maxTypeIndex + 1), { type: 'parent' })
});

const TypeList = new r.Struct({
  length: r.uint16,
  types: new r.Array(Type, t => t.length + 1)
});

const DFontMap = new r.Struct({
  reserved: new r.Reserved(r.uint8, 24),
  typeList: new r.Pointer(r.uint16, TypeList),
  nameListOffset: new r.Pointer(r.uint16, 'void')
});

const DFontHeader = new r.Struct({
  dataOffset: r.uint32,
  map: new r.Pointer(r.uint32, DFontMap),
  dataLength: r.uint32,
  mapLength: r.uint32
});

export default class DFont implements FontCollection {
  type = 'DFont' as const;
  header: any;
  sfnt: any;

  static probe(buffer: Buffer): boolean {
    const stream = new r.DecodeStream(buffer);
    let header;
    try {
      header = DFontHeader.decode(stream);
    } catch {
      return false;
    }
    for (const type of header.map.typeList.types) {
      if (type.name === 'sfnt') {
        return true;
      }
    }
    return false;
  }

  constructor(public stream: r.DecodeStream) {
    this.header = DFontHeader.decode(this.stream);

    for (const type of this.header.map.typeList.types) {
      for (const ref of type.refList) {
        if (ref.nameOffset >= 0) {
          this.stream.pos = ref.nameOffset + this.header.map.nameListOffset;
          ref.name = DFontName.decode(this.stream);
        } else {
          ref.name = null;
        }
      }

      if (type.name === 'sfnt') {
        this.sfnt = type;
      }
    }
  }

  getFont(name: string | Uint8Array): Font | null {
    if (!this.sfnt) {
      return null;
    }

    for (const ref of this.sfnt.refList) {
      const pos = this.header.dataOffset + ref.dataOffset + 4;
      const stream = new r.DecodeStream(this.stream.buffer.slice(pos));
      const font = new TTFFont(stream);
      if (
        font.postscriptName === name ||
        (
          font.postscriptName instanceof Uint8Array && 
          name instanceof Uint8Array && 
          font.postscriptName.every((v, i) => name[i] === v)
        )
      ) {
        return font;
      }
    }

    return null;
  }

  get fonts(): Font[] {
    const fonts = [];
    for (const ref of this.sfnt.refList) {
      const pos = this.header.dataOffset + ref.dataOffset + 4;
      const stream = new r.DecodeStream(this.stream.buffer.slice(pos));
      fonts.push(new TTFFont(stream));
    }
    return fonts;
  }
}
