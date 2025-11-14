import { cache } from '../decorators';
import Path from './Path';
import {isMark} from './isMark';
import StandardNames from './StandardNames';
import type { BBOX, Glyph as GlyphType } from '../types';
import type TTFFont from '../TTFFont';

interface Metrics { advanceWidth: number; advanceHeight: number; leftBearing: number; topBearing: number; }

/**
 * Glyph objects represent a glyph in the font. They have various properties for accessing metrics and
 * the actual vector path the glyph represents.
 *
 * You do not create glyph objects directly. They are created by various methods on the font object.
 * There are several subclasses of the base Glyph class internally that may be returned depending
 * on the font format, but they all inherit from this class.
 */
export default class Glyph implements GlyphType {
  isMark: boolean;
  isLigature: boolean;
  protected _metrics: Metrics | undefined;

  constructor(public id: number, public codePoints: number[], public _font: TTFFont) {
    // TODO: get this info from GDEF if available
    this.isMark = this.codePoints.length > 0 && this.codePoints.every(isMark);
    this.isLigature = this.codePoints.length > 1;
  }

  _getPath(): Path {
    return new Path();
  }

  _getCBox(): Path['cbox'] {
    return this.path.cbox;
  }

  _getBBox(): Path['bbox'] {
    return this.path.bbox;
  }

  #getTableMetrics(table: any): { advance: number; bearing: number } {
    if (this.id < table.metrics.length) {
      return table.metrics.get(this.id);
    }

    const metric = table.metrics.get(table.metrics.length - 1);
    return {
      advance: metric ? metric.advance : 0,
      bearing: table.bearings.get(this.id - table.metrics.length) || 0
    };
  }

  _getMetrics(cbox?: BBOX): Metrics {
    if (this._metrics) { return this._metrics; }

    let {advance: advanceWidth, bearing: leftBearing} = this.#getTableMetrics(this._font.hmtx);
    let advanceHeight: number,  topBearing: number;

    // For vertical metrics, use vmtx if available, or fall back to global data from OS/2 or hhea
    if (this._font.vmtx) {
      ({advance: advanceHeight, bearing: topBearing} = this.#getTableMetrics(this._font.vmtx));
    } else {
      const os2 = this._font['OS/2'];
      if (!cbox) { ({ cbox } = this); }
      if (os2.version) {
        advanceHeight = Math.abs(os2.typoAscender - os2.typoDescender);
        topBearing = os2.typoAscender - cbox.maxY;

      } else {
        const { hhea } = this._font;
        advanceHeight = Math.abs(hhea.ascent - hhea.descent);
        topBearing = hhea.ascent - cbox.maxY;
      }
    }

    if (this._font._variationProcessor && this._font.HVAR) {
      advanceWidth += this._font._variationProcessor.getAdvanceAdjustment(this.id, this._font.HVAR);
    }

    return this._metrics = { advanceWidth, advanceHeight, leftBearing, topBearing };
  }

  /**
   * The glyph’s control box.
   * This is often the same as the bounding box, but is faster to compute.
   * Because of the way bezier curves are defined, some of the control points
   * can be outside of the bounding box. Where `bbox` takes this into account,
   * `cbox` does not. Thus, cbox is less accurate, but faster to compute.
   * See [here](http://www.freetype.org/freetype2/docs/glyphs/glyphs-6.html#section-2)
   * for a more detailed description.
   */
  @cache
  get cbox(): Path['cbox'] {
    return this._getCBox();
  }

  /**
   * The glyph’s bounding box, i.e. the rectangle that encloses the
   * glyph outline as tightly as possible.
   */
  @cache
  get bbox(): Path['bbox'] {
    return this._getBBox();
  }

  /**
   * A vector Path object representing the glyph outline.
   */
  @cache
  get path(): Path {
    // Cache the path so we only decode it once
    // Decoding is actually performed by subclasses
    return this._getPath();
  }

  /**
   * Returns a path scaled to the given font size.
   */
  getScaledPath(size: number): Path {
    let scale = 1 / this._font.unitsPerEm * size;
    return this.path.scale(scale);
  }

  /**
   * The glyph's advance width.
   */
  @cache
  get advanceWidth(): number {
    return this._getMetrics().advanceWidth;
  }

  /**
   * The glyph's advance height.
   */
  @cache
  get advanceHeight(): number {
    return this._getMetrics().advanceHeight;
  }

  _getName(): string | null {
    const { post } = this._font;
    if (!post) {
      return null;
    }

    switch (post.version) {
      case 1:
        return StandardNames[this.id];

      case 2:
        const id = post.glyphNameIndex[this.id];
        return id < StandardNames.length ? StandardNames[id] : post.names[id - StandardNames.length];

      case 2.5:
        return StandardNames[this.id + post.offsets[this.id]];

      case 4:
        return String.fromCharCode(post.map[this.id]);
    }
  }

  /**
   * The glyph's name
   */
  @cache
  get name(): string | null {
    return this._getName();
  }

  /**
   * Renders the glyph to the given graphics context, at the specified font size.
   * @param {CanvasRenderingContext2d} ctx
   * @param {number} size
   */
  render(ctx: CanvasRenderingContext2D, size: number): void {
    ctx.save();

    const scale = 1 / this._font.head.unitsPerEm * size;
    ctx.scale(scale, scale);

    this.path.toFunction()(ctx);
    ctx.fill();

    ctx.restore();
  }
}
