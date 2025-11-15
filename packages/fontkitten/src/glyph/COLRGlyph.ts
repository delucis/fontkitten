import Glyph from './Glyph';
import BBox from './BBox';

interface Color { red: number, green: number, blue: number, alpha: number }
interface COLRGlyphLayer { glyph: Glyph, color: Color }

const COLRLayer = (glyph: COLRGlyph, color: Color): COLRGlyphLayer => ({ glyph, color });
const Black = { red: 0, green: 0, blue: 0, alpha: 255 } satisfies Color;


/**
 * Represents a color (e.g. emoji) glyph in Microsoft's COLR format.
 * Each glyph in this format contain a list of colored layers, each
 * of which  is another vector glyph.
 */
export default class COLRGlyph extends Glyph {
  type = 'COLR';

  _getBBox(): BBox {
    const bbox = new BBox;
    for (const layer of this.layers) {
      const b = layer.glyph.bbox;
      bbox.addPoint(b.minX, b.minY);
      bbox.addPoint(b.maxX, b.maxY);
    }
    return bbox;
  }

  /**
   * Returns an array of objects containing the glyph and color for
   * each layer in the composite color glyph.
   * @type {object[]}
   */
  get layers(): COLRGlyphLayer[] {
    const cpal = this._font.CPAL;
    const colr = this._font.COLR;
    let low = 0;
    let high = colr.baseGlyphRecord.length - 1;

    while (low <= high) {
      const mid = (low + high) >> 1;
      const rec = colr.baseGlyphRecord[mid];

      if (this.id < rec.gid) {
        high = mid - 1;
      } else if (this.id > rec.gid) {
        low = mid + 1;
      } else {
        var baseLayer = rec;
        break;
      }
    }

    // if base glyph not found in COLR table,
    // default to normal glyph from glyf or CFF
    if (baseLayer == null) {
      const g = this._font._getBaseGlyph(this.id);
      return [COLRLayer(g, Black)];
    }

    // otherwise, return an array of all the layers
    const layers: COLRGlyphLayer[] = [];
    for (let i = baseLayer.firstLayerIndex; i < baseLayer.firstLayerIndex + baseLayer.numLayers; i++) {
      const rec = colr.layerRecords[i];
      const color = cpal.colorRecords[rec.paletteIndex];
      const g = this._font._getBaseGlyph(rec.gid);
      layers.push(COLRLayer(g, color));
    }

    return layers;
  }
}
