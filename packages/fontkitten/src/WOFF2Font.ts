import * as r from '@fontkitten/restructure';
import TTFFont from './TTFFont';
import { brotliDecode } from './vendor/brotliDecode';
import TTFGlyph, { Point } from './glyph/TTFGlyph';
import WOFF2Glyph from './glyph/WOFF2Glyph';
import WOFF2Directory from './tables/WOFF2Directory';
import { Glyph } from './types';
import { asciiDecoder } from './utils';

/**
 * Subclass of TTFFont that represents a TTF/OTF font compressed by WOFF2
 * See spec here: http://www.w3.org/TR/WOFF2/
 */
export default class WOFF2Font extends TTFFont {
  type: TTFFont['type'] = 'WOFF2';
  _decompressed: boolean = false;
  declare _dataPos: number;
  declare _transformedGlyphs: any[];

  static probe(buffer: Buffer): boolean {
    return asciiDecoder.decode(buffer.slice(0, 4)) === 'wOF2';
  }

  _decodeDirectory(): any {
    const directory = WOFF2Directory.decode(this.stream);
    this._dataPos = this.stream.pos;
    return directory;
  }

  #decompress(): void {
    // decompress data and setup table offsets if we haven't already
    if (!this._decompressed) {
      this.stream.pos = this._dataPos;
      const buffer = this.stream.readBuffer(this.directory.totalCompressedSize);

      let decompressedSize = 0;
      for (const tag in this.directory.tables) {
        const entry = this.directory.tables[tag];
        entry.offset = decompressedSize;
        decompressedSize += (entry.transformLength != null) ? entry.transformLength : entry.length;
      }

      const decompressed = brotliDecode(new Int8Array(buffer));
      if (!decompressed) {
        throw new Error('Error decoding compressed data in WOFF2');
      }

      this.stream = new r.DecodeStream(decompressed);
      this._decompressed = true;
    }
  }

  protected _decodeTable(table: any): any {
    this.#decompress();
    return super._decodeTable(table);
  }

  // Override this method to get a glyph and return our
  // custom subclass if there is a glyf table.
  _getBaseGlyph(glyph: number, characters: number[] = []): Glyph | null {
    if (!this._glyphs[glyph]) {
      if (this.directory.tables.glyf?.transformed) {
        if (!this._transformedGlyphs) { this._transformGlyfTable(); }
        return this._glyphs[glyph] = new WOFF2Glyph(glyph, characters, this);

      } else {
        return super._getBaseGlyph(glyph, characters);
      }
    } else {
      return this._glyphs[glyph];
    }
  }

  _transformGlyfTable(): void {
    this.#decompress();
    this.stream.pos = this.directory.tables.glyf.offset;
    const table = GlyfTable.decode(this.stream);
    const glyphs: { numberOfContours: number, points?: Point[] }[] = [];

    for (let index = 0; index < table.numGlyphs; index++) {
      const nContours = table.nContours.readInt16BE();
      let points: Point[] = [];

      if (nContours > 0) { // simple glyph
        const nPoints: number[] = [];
        let totalPoints = 0;

        for (let i = 0; i < nContours; i++) {
          totalPoints += read255UInt16(table.nPoints);
          nPoints.push(totalPoints);
        }

        points = decodeTriplet(table.flags, table.glyphs, totalPoints);
        for (let i = 0; i < nContours; i++) {
          points[nPoints[i] - 1].endContour = true;
        }

        read255UInt16(table.glyphs); // Consume instructions
      } else if (nContours < 0) { // composite glyph
        const haveInstructions = TTFGlyph.prototype._decodeComposite.call({ _font: this }, { numberOfCountours: nContours }, table.composites);
        if (haveInstructions) {
          read255UInt16(table.glyphs); // Consume instructions
        }
      }

      glyphs.push({ numberOfContours: nContours, points });
    }

    this._transformedGlyphs = glyphs;
  }
}

// Special class that accepts a length and returns a sub-stream for that data
class Substream {
  #buf: any;

  constructor(public length: string) {
    this.#buf = new r.Buffer(length);
  }

  decode(stream: r.DecodeStream, parent: any): any {
    return new r.DecodeStream(this.#buf.decode(stream, parent));
  }
}

// This struct represents the entire glyf table
const GlyfTable = new r.Struct({
  version: r.uint32,
  numGlyphs: r.uint16,
  indexFormat: r.uint16,
  nContourStreamSize: r.uint32,
  nPointsStreamSize: r.uint32,
  flagStreamSize: r.uint32,
  glyphStreamSize: r.uint32,
  compositeStreamSize: r.uint32,
  bboxStreamSize: r.uint32,
  instructionStreamSize: r.uint32,
  nContours: new Substream('nContourStreamSize'),
  nPoints: new Substream('nPointsStreamSize'),
  flags: new Substream('flagStreamSize'),
  glyphs: new Substream('glyphStreamSize'),
  composites: new Substream('compositeStreamSize'),
  bboxes: new Substream('bboxStreamSize'),
  instructions: new Substream('instructionStreamSize')
});

const WORD_CODE = 253;
const ONE_MORE_BYTE_CODE2 = 254;
const ONE_MORE_BYTE_CODE1 = 255;
const LOWEST_U_CODE = 253;

function read255UInt16(stream: r.DecodeStream): number {
  const code = stream.readUInt8();
  switch (code) {
    case WORD_CODE: return stream.readUInt16BE();
    case ONE_MORE_BYTE_CODE1: return stream.readUInt8() + LOWEST_U_CODE;
    case ONE_MORE_BYTE_CODE2: return stream.readUInt8() + LOWEST_U_CODE * 2;
    default: return code;
  }
}

function withSign(flag: number, baseval: number): number {
  return flag & 1 ? baseval : -baseval;
}

function decodeTriplet(flags: any, glyphs: any, nPoints: number): Point[] {
  let y;
  let x = y = 0;
  const res: Point[] = [];

  for (let i = 0; i < nPoints; i++) {
    let dx = 0, dy = 0;
    let flag = flags.readUInt8();
    const onCurve = !(flag >> 7);
    flag &= 0x7f;

    if (flag < 10) {
      dx = 0;
      dy = withSign(flag, ((flag & 14) << 7) + glyphs.readUInt8());

    } else if (flag < 20) {
      dx = withSign(flag, (((flag - 10) & 14) << 7) + glyphs.readUInt8());
      dy = 0;

    } else if (flag < 84) {
      var b0 = flag - 20;
      var b1 = glyphs.readUInt8();
      dx = withSign(flag, 1 + (b0 & 0x30) + (b1 >> 4));
      dy = withSign(flag >> 1, 1 + ((b0 & 0x0c) << 2) + (b1 & 0x0f));

    } else if (flag < 120) {
      var b0 = flag - 84;
      dx = withSign(flag, 1 + ((b0 / 12) << 8) + glyphs.readUInt8());
      dy = withSign(flag >> 1, 1 + (((b0 % 12) >> 2) << 8) + glyphs.readUInt8());

    } else if (flag < 124) {
      var b1 = glyphs.readUInt8();
      let b2 = glyphs.readUInt8();
      dx = withSign(flag, (b1 << 4) + (b2 >> 4));
      dy = withSign(flag >> 1, ((b2 & 0x0f) << 8) + glyphs.readUInt8());

    } else {
      dx = withSign(flag, glyphs.readUInt16BE());
      dy = withSign(flag >> 1, glyphs.readUInt16BE());
    }

    x += dx;
    y += dy;
    res.push(new Point(onCurve, false, x, y));
  }

  return res;
}
