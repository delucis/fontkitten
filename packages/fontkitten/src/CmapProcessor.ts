import { binarySearch } from './utils';
import { getEncoding, getEncodingMapping } from './encodings';
import { cache } from './decorators';
import { range } from './utils';

export default class CmapProcessor {
  #cmap: any;
  #uvs: null | {
    version: number;
    varSelectors: {
      toArray: () => Array<{
        varSelector: number;
        defaultUVS: Array<{ startUnicodeValue: number; additionalCount: number; }>;
        nonDefaultUVS: Array<{ unicodeValue: number; glyphID: number; }>;
      }>;
    }
  };
  #encoding: any;

  constructor(cmapTable: { tables: { platformID: number, encodingID: number, table: any }[] }) {
    // Attempt to find a Unicode cmap first
    this.#encoding = null;
    this.#cmap = this.#findSubtable(cmapTable, [
      // 32-bit subtables
      [3, 10],
      [0, 6],
      [0, 4],

      // 16-bit subtables
      [3, 1],
      [0, 3],
      [0, 2],
      [0, 1],
      [0, 0]
    ]);

    // If not unicode cmap was found, take the first table with a supported encoding.
    if (!this.#cmap) {
      for (let cmap of cmapTable.tables) {
        let encoding = getEncoding(cmap.platformID, cmap.encodingID, cmap.table.language - 1);
        let mapping = getEncodingMapping(encoding);
        if (mapping) {
          this.#cmap = cmap.table;
          this.#encoding = mapping;
        }
      }
    }

    if (!this.#cmap) {
      throw new Error("Could not find a supported cmap table");
    }

    this.#uvs = this.#findSubtable(cmapTable, [[0, 5]]);
    if (this.#uvs && this.#uvs.version !== 14) {
      this.#uvs = null;
    }
  }

  #findSubtable(cmapTable: { tables: { platformID: number, encodingID: number, table: any }[] }, pairs: [number, number][]): any {
    for (let [platformID, encodingID] of pairs) {
      for (let cmap of cmapTable.tables) {
        if (cmap.platformID === platformID && cmap.encodingID === encodingID) {
          return cmap.table;
        }
      }
    }

    return null;
  }

  lookup(codepoint: number, variationSelector?: number): number {
    // If there is no Unicode cmap in this font, we need to re-encode
    // the codepoint in the encoding that the cmap supports.
    if (this.#encoding) {
      codepoint = this.#encoding.get(codepoint) || codepoint;

      // Otherwise, try to get a Unicode variation selector for this codepoint if one is provided.
    } else if (variationSelector) {
      let gid = this.#getVariationSelector(codepoint, variationSelector);
      if (gid) {
        return gid;
      }
    }

    let cmap = this.#cmap;
    switch (cmap.version) {
      case 0:
        return cmap.codeMap.get(codepoint) || 0;

      case 4: {
        let min = 0;
        let max = cmap.segCount - 1;
        while (min <= max) {
          let mid = (min + max) >> 1;

          if (codepoint < cmap.startCode.get(mid)) {
            max = mid - 1;
          } else if (codepoint > cmap.endCode.get(mid)) {
            min = mid + 1;
          } else {
            let rangeOffset = cmap.idRangeOffset.get(mid);
            let gid;

            if (rangeOffset === 0) {
              gid = codepoint + cmap.idDelta.get(mid);
            } else {
              let index = rangeOffset / 2 + (codepoint - cmap.startCode.get(mid)) - (cmap.segCount - mid);
              gid = cmap.glyphIndexArray.get(index) || 0;
              if (gid !== 0) {
                gid += cmap.idDelta.get(mid);
              }
            }

            return gid & 0xffff;
          }
        }

        return 0;
      }

      case 8:
        throw new Error('TODO: cmap format 8');

      case 6:
      case 10:
        return cmap.glyphIndices.get(codepoint - cmap.firstCode) || 0;

      case 12:
      case 13: {
        let min = 0;
        let max = cmap.nGroups - 1;
        while (min <= max) {
          let mid = (min + max) >> 1;
          let group = cmap.groups.get(mid);

          if (codepoint < group.startCharCode) {
            max = mid - 1;
          } else if (codepoint > group.endCharCode) {
            min = mid + 1;
          } else {
            if (cmap.version === 12) {
              return group.glyphID + (codepoint - group.startCharCode);
            } else {
              return group.glyphID;
            }
          }
        }

        return 0;
      }

      case 14:
        throw new Error('TODO: cmap format 14');

      default:
        throw new Error(`Unknown cmap format ${cmap.version}`);
    }
  }

  #getVariationSelector(codepoint: number, variationSelector: number): number {
    if (!this.#uvs) {
      return 0;
    }

    let selectors = this.#uvs.varSelectors.toArray();
    let i = binarySearch(selectors, (x) => variationSelector - x.varSelector);
    let sel = selectors[i];

    if (i !== -1 && sel.defaultUVS) {
      i = binarySearch(sel.defaultUVS, (x) =>
        codepoint < x.startUnicodeValue ? -1 : codepoint > x.startUnicodeValue + x.additionalCount ? +1 : 0
      );
    }

    if (i !== -1 && sel.nonDefaultUVS) {
      i = binarySearch(sel.nonDefaultUVS, (x) => codepoint - x.unicodeValue);
      if (i !== -1) {
        return sel.nonDefaultUVS[i].glyphID;
      }
    }

    return 0;
  }

  @cache
  getCharacterSet(): number[] {
    let cmap = this.#cmap;
    switch (cmap.version) {
      case 0:
        return range(0, cmap.codeMap.length);

      case 4: {
        let res = [];
        let endCodes = cmap.endCode.toArray();
        for (let i = 0; i < endCodes.length; i++) {
          let tail = endCodes[i] + 1;
          let start = cmap.startCode.get(i);
          res.push(...range(start, tail));
        }

        return res;
      }

      case 8:
        throw new Error('TODO: cmap format 8');

      case 6:
      case 10:
        return range(cmap.firstCode, cmap.firstCode + cmap.glyphIndices.length);

      case 12:
      case 13: {
        let res = [];
        for (let group of cmap.groups.toArray()) {
          res.push(...range(group.startCharCode, group.endCharCode + 1));
        }

        return res;
      }

      case 14:
        throw new Error('TODO: cmap format 14');

      default:
        throw new Error(`Unknown cmap format ${cmap.version}`);
    }
  }
}
