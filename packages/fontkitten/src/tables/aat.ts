import * as r from '@fontkitten/restructure';

class UnboundedArrayAccessor {
  #base: number;
  #items: any[] = [];

  constructor(public type: any, public stream: r.DecodeStream, public parent: any) {
    this.#base = this.stream.pos;
  }

  getItem(index: number): any {
    if (this.#items[index] == null) {
      const pos = this.stream.pos;
      this.stream.pos = this.#base + this.type.size(null, this.parent) * index;
      this.#items[index] = this.type.decode(this.stream, this.parent);
      this.stream.pos = pos;
    }

    return this.#items[index];
  }

  inspect() {
    return `[UnboundedArray ${this.type.constructor.name}]`;
  }
}

export class UnboundedArray<T extends any[]> extends r.Array<T> {
  constructor(type: any) {
    super(type, 0);
  }

  decode(stream: r.DecodeStream, parent: any): UnboundedArrayAccessor {
    return new UnboundedArrayAccessor(this.type, stream, parent);
  }
}

export function LookupTable(ValueType = r.uint16) {
  // Helper class that makes internal structures invisible to pointers
  class Shadow {
    constructor(public type: any) {}

    decode(stream: r.DecodeStream, ctx: any) {
      ctx = ctx.parent.parent;
      return this.type.decode(stream, ctx);
    }
  }

  ValueType = new Shadow(ValueType);

  const BinarySearchHeader = new r.Struct({
    unitSize: r.uint16,
    nUnits: r.uint16,
    searchRange: r.uint16,
    entrySelector: r.uint16,
    rangeShift: r.uint16
  });

  const LookupSegmentSingle = new r.Struct({
    lastGlyph: r.uint16,
    firstGlyph: r.uint16,
    value: ValueType
  });

  const LookupSegmentArray = new r.Struct({
    lastGlyph: r.uint16,
    firstGlyph: r.uint16,
    values: new r.Pointer(r.uint16, new r.Array(ValueType, t => t.lastGlyph - t.firstGlyph + 1), {type: 'parent'})
  });

  const LookupSingle = new r.Struct({
    glyph: r.uint16,
    value: ValueType
  });

  return new r.VersionedStruct(r.uint16, {
    0: {
      values: new UnboundedArray(ValueType) // length == number of glyphs maybe?
    },
    2: {
      binarySearchHeader: BinarySearchHeader,
      segments: new r.Array(LookupSegmentSingle, t => t.binarySearchHeader.nUnits)
    },
    4: {
      binarySearchHeader: BinarySearchHeader,
      segments: new r.Array(LookupSegmentArray, t => t.binarySearchHeader.nUnits)
    },
    6: {
      binarySearchHeader: BinarySearchHeader,
      segments: new r.Array(LookupSingle, t => t.binarySearchHeader.nUnits)
    },
    8: {
      firstGlyph: r.uint16,
      count: r.uint16,
      values: new r.Array(ValueType, 'count')
    }
  });
};

export function StateTable(entryData = {}) {
  const Entry = new r.Struct({
    newState: r.uint16,
    flags: r.uint16,
    ...entryData,
  });
  const StateArray = new UnboundedArray(new r.Array(r.uint16, t => t.nClasses));

  const StateHeader = new r.Struct({
    nClasses: r.uint32,
    classTable: new r.Pointer(r.uint32, new LookupTable(r.uint16)),
    stateArray: new r.Pointer(r.uint32, StateArray),
    entryTable: new r.Pointer(r.uint32, new UnboundedArray(Entry))
  });

  return StateHeader;
}

// This is the old version of the StateTable structure
export function StateTable1(entryData = {}) {
  const ClassLookupTable = new r.Struct({
    version() { return 8; }, // simulate LookupTable
    firstGlyph: r.uint16,
    values: new r.Array(r.uint8, r.uint16)
  });

  const Entry = new r.Struct({
    newStateOffset: r.uint16,
    // convert offset to stateArray index
    newState: t => (t.newStateOffset - (t.parent.stateArray.base - t.parent._startOffset)) / t.parent.nClasses,
    flags: r.uint16,
    ...entryData,
  });
  const StateArray = new UnboundedArray(new r.Array(r.uint8, t => t.nClasses));

  const StateHeader1 = new r.Struct({
    nClasses: r.uint16,
    classTable: new r.Pointer(r.uint16, ClassLookupTable),
    stateArray: new r.Pointer(r.uint16, StateArray),
    entryTable: new r.Pointer(r.uint16, new UnboundedArray(Entry))
  });

  return StateHeader1;
}
