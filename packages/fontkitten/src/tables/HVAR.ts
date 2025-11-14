import * as r from '@fontkitten/restructure';
import { resolveLength } from '@fontkitten/restructure';
import { ItemVariationStore } from './variations';

// TODO: add this to restructure
class VariableSizeNumber {
  #size: (ctx: any) => number;
  constructor(size: (ctx: any) => number) {
    this.#size = size;
  }

  decode(stream: r.DecodeStream, parent: any) {
    switch (this.size(0, parent)) {
      case 1: return stream.readUInt8();
      case 2: return stream.readUInt16BE();
      case 3: return stream.readUInt24BE();
      case 4: return stream.readUInt32BE();
    }
  }

  size(_val: number, parent: any) {
    return resolveLength(this.#size, null, parent);
  }
}

const MapDataEntry = new r.Struct({
  entry: new VariableSizeNumber(t => ((t.parent.entryFormat & 0x0030) >> 4) + 1),
  outerIndex: t => t.entry >> ((t.parent.entryFormat & 0x000F) + 1),
  innerIndex: t => t.entry & ((1 << ((t.parent.entryFormat & 0x000F) + 1)) - 1)
});

const DeltaSetIndexMap = new r.Struct({
  entryFormat: r.uint16,
  mapCount: r.uint16,
  mapData: new r.Array(MapDataEntry, 'mapCount')
});

export default new r.Struct({
  majorVersion: r.uint16,
  minorVersion: r.uint16,
  itemVariationStore: new r.Pointer(r.uint32, ItemVariationStore),
  advanceWidthMapping: new r.Pointer(r.uint32, DeltaSetIndexMap),
  LSBMapping: new r.Pointer(r.uint32, DeltaSetIndexMap),
  RSBMapping: new r.Pointer(r.uint32, DeltaSetIndexMap)
});
