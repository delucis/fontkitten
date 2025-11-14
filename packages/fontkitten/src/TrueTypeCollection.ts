import * as r from '@fontkitten/restructure';
import TTFFont from './TTFFont';
import type { Font, FontCollection } from './types';
import { asciiDecoder } from './utils';

const TTCHeader = new r.VersionedStruct(r.uint32, {
  0x00010000: {
    numFonts:   r.uint32,
    offsets:    new r.Array(r.uint32, 'numFonts')
  },
  0x00020000: {
    numFonts:   r.uint32,
    offsets:    new r.Array(r.uint32, 'numFonts'),
    dsigTag:    r.uint32,
    dsigLength: r.uint32,
    dsigOffset: r.uint32
  }
});

export default class TrueTypeCollection implements FontCollection {
  type = 'TTC' as const;
  header: any;

  static probe(buffer: Buffer): boolean {
    return asciiDecoder.decode(buffer.slice(0, 4)) === 'ttcf';
  }

  constructor(public stream: r.DecodeStream) {
    if (stream.readString(4) !== 'ttcf') {
      throw new Error('Not a TrueType collection');
    }

    this.header = TTCHeader.decode(stream);
  }

  getFont(name: string | Uint8Array): Font | null {
    for (const offset of this.header.offsets) {
      const stream = new r.DecodeStream(this.stream.buffer);
      stream.pos = offset;
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
    return this.header.offsets.map((offset: number) => {
      const stream = new r.DecodeStream(this.stream.buffer);
      stream.pos = offset;
      return new TTFFont(stream);
    });
  }
}
