import * as r from '@fontkitten/restructure';
import { cache } from './decorators';
import Directory from './tables/directory';
import tables from './tables';
import CmapProcessor from './CmapProcessor';
import TTFGlyph from './glyph/TTFGlyph';
import CFFGlyph from './glyph/CFFGlyph';
import SBIXGlyph from './glyph/SBIXGlyph';
import COLRGlyph from './glyph/COLRGlyph';
import GlyphVariationProcessor from './glyph/GlyphVariationProcessor';
import BBox from './glyph/BBox';
import { asciiDecoder } from './utils';
import { BBOX, Font, Glyph, HHEA, Os2Table } from './types';

/**
 * This is the base class for all SFNT-based font formats in fontkitten.
 * It supports TrueType, and PostScript glyphs, and several color glyph formats.
 */
export default class TTFFont implements Font {
  type: Font['type'] = 'TTF';
  stream: any;
  #variationCoords: number[] | null;
  #directoryPos: number;
  #tables: Record<string, {}> = {};
  protected _glyphs: Record<number, Glyph> = {};
  directory: any;
  'OS/2': Os2Table;
  'hhea': HHEA;

  static probe(buffer: Buffer): boolean {
    let format = asciiDecoder.decode(buffer.slice(0, 4));
    return format === 'true' || format === 'OTTO' || format === String.fromCharCode(0, 1, 0, 0);
  }

  constructor(stream: any, variationCoords = null) {
    this.stream = stream;
    this.#variationCoords = variationCoords;

    this.#directoryPos = this.stream.pos;
    this._decodeDirectory();

    // define properties for each table to lazily parse
    for (const tag in this.directory.tables) {
      let table = this.directory.tables[tag];
      if (tables[tag] && table.length > 0) {
        Object.defineProperty(this, tag, {
          get: this.#getTable.bind(this, table)
        });
      }
    }
  }

  #getTable(table: any): any {
    if (!(table.tag in this.#tables)) {
      try {
        this.#tables[table.tag] = this._decodeTable(table);
      } catch {}
    }

    return this.#tables[table.tag];
  }

  _getTableStream(tag: string): any {
    let table = this.directory.tables[tag];
    if (table) {
      this.stream.pos = table.offset;
      return this.stream;
    }

    return null;
  }

  _decodeDirectory(): void {
    this.directory = Directory.decode(this.stream, {_startOffset: 0});
  }

  protected _decodeTable(table: any): any {
    let pos = this.stream.pos;

    let stream = this._getTableStream(table.tag);
    let result = tables[table.tag].decode(stream, this, table.length);

    this.stream.pos = pos;
    return result;
  }

  /**
   * Gets a string from the font's `name` table
   */
  getName(key: string): string {
    const record = this.name?.records[key];
    return record?.['en'] || record?.[Object.keys(record)[0]] || null;
  }

  /**
   * The unique PostScript name for this font, e.g. "Helvetica-Bold"
   */
  get postscriptName(): string {
    return this.getName('postscriptName');
  }

  /**
   * The font's full name, e.g. "Helvetica Bold"
   */
  get fullName(): string {
    return this.getName('fullName');
  }

  /**
   * The font's family name, e.g. "Helvetica"
   */
  get familyName(): string {
    return this.getName('fontFamily');
  }

  /**
   * The font's sub-family, e.g. "Bold".
   */
  get subfamilyName(): string {
    return this.getName('fontSubfamily');
  }

  /**
   * The font's copyright information
   */
  get copyright(): string {
    return this.getName('copyright');
  }

  /**
   * The font's version number
   */
  get version(): string {
    return this.getName('version');
  }

  /**
   * The font’s [ascender](https://en.wikipedia.org/wiki/Ascender_(typography))
   */
  get ascent(): number {
    return this.hhea.ascent;
  }

  /**
   * The font’s [descender](https://en.wikipedia.org/wiki/Descender)
   */
  get descent(): number {
    return this.hhea.descent;
  }

  /**
   * The amount of space that should be included between lines
   */
  get lineGap(): number {
    return this.hhea.lineGap;
  }

  /**
   * The offset from the normal underline position that should be used
   */
  get underlinePosition(): number {
    return this.post.underlinePosition;
  }

  /**
   * The weight of the underline that should be used
   */
  get underlineThickness(): number {
    return this.post.underlineThickness;
  }

  /**
   * If this is an italic font, the angle the cursor should be drawn at to match the font design
   */
  get italicAngle(): number {
    return this.post.italicAngle;
  }

  /**
   * The height of capital letters above the baseline.
   * See [here](https://en.wikipedia.org/wiki/Cap_height) for more details.
   */
  get capHeight(): number {
    let os2 = this['OS/2'];
    return os2 ? os2.capHeight : this.ascent;
  }

  /**
   * The height of lower case letters in the font.
   * See [here](https://en.wikipedia.org/wiki/X-height) for more details.
   */
  get xHeight(): number {
    let os2 = this['OS/2'];
    return os2 ? os2.xHeight : 0;
  }

  /**
   * The number of glyphs in the font.
   */
  get numGlyphs(): number {
    return this.maxp.numGlyphs;
  }

  /**
   * The size of the font’s internal coordinate grid
   */
  get unitsPerEm(): number {
    return this.head.unitsPerEm;
  }

  /**
   * The font’s bounding box, i.e. the box that encloses all glyphs in the font.
   */
  @cache
  get bbox(): BBOX {
    return Object.freeze(new BBox(this.head.xMin, this.head.yMin, this.head.xMax, this.head.yMax));
  }

  @cache
  get _cmapProcessor(): CmapProcessor {
    return new CmapProcessor(this.cmap);
  }

  /**
   * An array of all of the unicode code points supported by the font.
   */
  @cache
  get characterSet(): number[] {
    return this._cmapProcessor.getCharacterSet();
  }

  /**
   * Returns whether there is glyph in the font for the given unicode code point.
   *
   * @param {number} codePoint
   * @return {boolean}
   */
  hasGlyphForCodePoint(codePoint: number): boolean {
    return !!this._cmapProcessor.lookup(codePoint);
  }

  /**
   * Maps a single unicode code point to a Glyph object.
   * Does not perform any advanced substitutions (there is no context to do so).
   */
  glyphForCodePoint(codePoint: number): Glyph {
    return this.getGlyph(this._cmapProcessor.lookup(codePoint), [codePoint]);
  }

  /**
   * Returns an array of Glyph objects for the given string.
   * This is only a one-to-one mapping from characters to glyphs.
   */
  glyphsForString(string: string): Glyph[] {
    let glyphs = [];
    let len = string.length;
    let idx = 0;
    let last = -1;
    let state = -1;

    while (idx <= len) {
      let code = 0;
      let nextState = 0;

      if (idx < len) {
        // Decode the next codepoint from UTF 16
        code = string.charCodeAt(idx++);
        if (0xd800 <= code && code <= 0xdbff && idx < len) {
          let next = string.charCodeAt(idx);
          if (0xdc00 <= next && next <= 0xdfff) {
            idx++;
            code = ((code & 0x3ff) << 10) + (next & 0x3ff) + 0x10000;
          }
        }

        // Compute the next state: 1 if the next codepoint is a variation selector, 0 otherwise.
        nextState = ((0xfe00 <= code && code <= 0xfe0f) || (0xe0100 <= code && code <= 0xe01ef)) ? 1 : 0;
      } else {
        idx++;
      }

      if (state === 0 && nextState === 1) {
        // Variation selector following normal codepoint.
        glyphs.push(this.getGlyph(this._cmapProcessor.lookup(last, code), [last, code]));
      } else if (state === 0 && nextState === 0) {
        // Normal codepoint following normal codepoint.
        glyphs.push(this.glyphForCodePoint(last));
      }

      last = code;
      state = nextState;
    }

    return glyphs;
  }

  _getBaseGlyph(glyph: number, characters: number[] = []): Glyph | null {
    if (!this._glyphs[glyph]) {
      if (this.directory.tables.glyf) {
        this._glyphs[glyph] = new TTFGlyph(glyph, characters, this);

      } else if (this.directory.tables['CFF '] || this.directory.tables.CFF2) {
        this._glyphs[glyph] = new CFFGlyph(glyph, characters, this);
      }
    }

    return this._glyphs[glyph] || null;
  }

  /**
   * Returns a glyph object for the given glyph id.
   * You can pass the array of code points this glyph represents for
   * your use later, and it will be stored in the glyph object.
   */
  getGlyph(glyph: number, characters: number[] = []): Glyph {
    if (!this._glyphs[glyph]) {
      if (this.directory.tables.sbix) {
        this._glyphs[glyph] = new SBIXGlyph(glyph, characters, this);

      } else if ((this.directory.tables.COLR) && (this.directory.tables.CPAL)) {
        this._glyphs[glyph] = new COLRGlyph(glyph, characters, this);

      } else {
        this._getBaseGlyph(glyph, characters);
      }
    }

    return this._glyphs[glyph] || null;
  }

  /**
   * Returns an object describing the available variation axes
   * that this font supports. Keys are setting tags, and values
   * contain the axis name, range, and default value.
   */
  @cache
  get variationAxes(): Record<string, { name: string; min: number; default: number; max: number }> {
    let res: Record<string, { name: string; min: number; default: number; max: number }> = {};
    if (!this.fvar) {
      return res;
    }

    for (let axis of this.fvar.axis) {
      res[axis.axisTag.trim()] = {
        name: axis.name.en,
        min: axis.minValue,
        default: axis.defaultValue,
        max: axis.maxValue
      };
    }

    return res;
  }

  /**
   * Returns an object describing the named variation instances
   * that the font designer has specified. Keys are variation names
   * and values are the variation settings for this instance.
   */
  @cache
  get namedVariations(): Record<string, Record<string, number>> {
    let res: Record<string, Record<string, number>> = {};
    if (!this.fvar) {
      return res;
    }

    for (let instance of this.fvar.instance) {
      let settings: Record<string, number> = {};
      for (let i = 0; i < this.fvar.axis.length; i++) {
        let axis = this.fvar.axis[i];
        settings[axis.axisTag.trim()] = instance.coord[i];
      }

      res[instance.name.en] = settings;
    }

    return res;
  }

  /**
   * Returns a new font with the given variation settings applied.
   * Settings can either be an instance name, or an object containing
   * variation tags as specified by the `variationAxes` property.
   *
   * @param {object} settings
   * @return {TTFFont}
   */
  getVariation(settings: string | Record<string, number>): Font {
    if (!(this.directory.tables.fvar && ((this.directory.tables.gvar && this.directory.tables.glyf) || this.directory.tables.CFF2))) {
      throw new Error('Variations require a font with the fvar, gvar and glyf, or CFF2 tables.');
    }

    if (typeof settings === 'string') {
      settings = this.namedVariations[settings];
    }

    if (typeof settings !== 'object') {
      throw new Error('Variation settings must be either a variation name or settings object.');
    }

    // normalize the coordinates
    let coords = this.fvar.axis.map((axis, i) => {
      let axisTag = axis.axisTag.trim();
      if (axisTag in settings) {
        return Math.max(axis.minValue, Math.min(axis.maxValue, settings[axisTag]));
      } else {
        return axis.defaultValue;
      }
    });

    let stream = new r.DecodeStream(this.stream.buffer);
    stream.pos = this.#directoryPos;

    let font = new TTFFont(stream, coords);
    font.#tables = this.#tables;

    return font;
  }

  @cache
  get _variationProcessor(): GlyphVariationProcessor | null {
    if (!this.fvar) {
      return null;
    }

    let variationCoords = this.#variationCoords;

    // Ignore if no variation coords and not CFF2
    if (!variationCoords && !this.CFF2) {
      return null;
    }

    if (!variationCoords) {
      variationCoords = this.fvar.axis.map(axis => axis.defaultValue);
    }

    return new GlyphVariationProcessor(this, variationCoords);
  }

  // Standardized format plugin API
  getFont(name: string): Font {
    return this.getVariation(name);
  }
}
