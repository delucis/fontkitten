import * as r from '@fontkitten/restructure';
import TTFGlyph from './TTFGlyph';

const SBIXImage = new r.Struct({
  originX: r.uint16,
  originY: r.uint16,
  type: new r.String(4),
  data: new r.Buffer(t => t.parent.buflen - t._currentOffset)
});

/**
 * Represents a color (e.g. emoji) glyph in Apple's SBIX format.
 */
export default class SBIXGlyph extends TTFGlyph {
  type = 'SBIX';

  /**
   * Returns an object representing a glyph image at the given point size.
   * The object has a data property with a Buffer containing the actual image data,
   * along with the image type, and origin.
   */
  getImageForSize(size: number): {originX: number, originY: number, type: string, data: Buffer} | null {
    for (let i = 0; i < this._font.sbix.imageTables.length; i++) {
      var table = this._font.sbix.imageTables[i];
      if (table.ppem >= size) { break; }
    }

    const offsets = table.imageOffsets;
    const start = offsets[this.id];
    const end = offsets[this.id + 1];

    if (start === end) {
      return null;
    }

    this._font.stream.pos = start;
    return SBIXImage.decode(this._font.stream, {buflen: end - start});
  }

  render(ctx: CanvasRenderingContext2D, size: number): void {
    let img = this.getImageForSize(size);
    if (img != null) {
      let scale = size / this._font.unitsPerEm;
      ctx.image(img.data, {height: size, x: img.originX, y: (this.bbox.minY - img.originY) * scale});
    }

    if (this._font.sbix.flags.renderOutlines) {
      super.render(ctx, size);
    }
  }
}
