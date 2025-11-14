import type * as r from '@fontkitten/restructure';
import CFFTop from './CFFTop';
import standardStrings from './CFFStandardStrings';

class CFFFont {
  constructor(public stream: r.DecodeStream) {
    this.decode();
  }

  static decode(stream: r.DecodeStream): CFFFont {
    return new CFFFont(stream);
  }

  decode(): this {
    const top = CFFTop.decode(this.stream);
    for (const key in top) {
      this[key] = top[key];
    }

    if (this.version < 2) {
      if (this.topDictIndex.length !== 1) {
        throw new Error("Only a single font is allowed in CFF");
      }

      this.topDict = this.topDictIndex[0];
    }

    this.isCIDFont = this.topDict.ROS != null;
    return this;
  }

  string(sid: number): string | null {
    if (this.version >= 2) {
      return null;
    }

    if (sid < standardStrings.length) {
      return standardStrings[sid];
    }

    return this.stringIndex[sid - standardStrings.length];
  }

  get postscriptName(): string | null {
    return (this.version < 2) ? this.nameIndex[0] : null;
  }

  get fullName(): string | null {
    return this.string(this.topDict.FullName);
  }

  get familyName(): string | null {
    return this.string(this.topDict.FamilyName);
  }

  getCharString(glyph: number): Uint8Array {
    this.stream.pos = this.topDict.CharStrings[glyph].offset;
    return this.stream.readBuffer(this.topDict.CharStrings[glyph].length);
  }

  getGlyphName(gid: number): string | null {
    // - CFF2 glyph names are in the post table.
    // - CID-keyed fonts don't have glyph names.
    if (this.version >= 2 || this.isCIDFont) {
      return null;
    }

    const { charset } = this.topDict;
    if (Array.isArray(charset)) {
      return charset[gid];
    }

    if (gid === 0) {
      return '.notdef';
    }

    gid -= 1;

    switch (charset.version) {
      case 0:
        return this.string(charset.glyphs[gid]);

      case 1:
      case 2:
        for (let i = 0; i < charset.ranges.length; i++) {
          let range = charset.ranges[i];
          if (range.offset <= gid && gid <= range.offset + range.nLeft) {
            return this.string(range.first + (gid - range.offset));
          }
        }
        break;
    }

    return null;
  }

  fdForGlyph(gid: number): number | null {
    if (!this.topDict.FDSelect) {
      return null;
    }

    switch (this.topDict.FDSelect.version) {
      case 0:
        return this.topDict.FDSelect.fds[gid];

      case 3:
      case 4:
        const { ranges } = this.topDict.FDSelect;
        let low = 0;
        let high = ranges.length - 1;

        while (low <= high) {
          const mid = (low + high) >> 1;

          if (gid < ranges[mid].first) {
            high = mid - 1;
          } else if (mid < high && gid >= ranges[mid + 1].first) {
            low = mid + 1;
          } else {
            return ranges[mid].fd;
          }
        }
      default:
        throw new Error(`Unknown FDSelect version: ${this.topDict.FDSelect.version}`);
    }
  }

  privateDictForGlyph(gid: number): any | null {
    if (this.topDict.FDSelect) {
      const fd = this.fdForGlyph(gid);
      if (this.topDict.FDArray[fd]) {
        return this.topDict.FDArray[fd].Private;
      }

      return null;
    }

    if (this.version < 2) {
      return this.topDict.Private;
    }

    return this.topDict.FDArray[0].Private;
  }
}

export default CFFFont;
