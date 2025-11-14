import * as r from '@fontkitten/restructure';
import { resolveLength } from '@fontkitten/restructure';
import CFFDict from './CFFDict';
import CFFIndex from './CFFIndex';
import CFFPointer from './CFFPointer';
import CFFPrivateDict from './CFFPrivateDict';
import { StandardEncoding, ExpertEncoding } from './CFFEncodings';
import { ISOAdobeCharset, ExpertCharset, ExpertSubsetCharset } from './CFFCharsets';
import { ItemVariationStore } from '../tables/variations';

// Checks if an operand is an index of a predefined value,
// otherwise delegates to the provided type.
class PredefinedOp {
  constructor(public predefinedOps: string[][], public type: any) {}

  decode(stream: r.DecodeStream, parent: any, operands: number[]): unknown {
    if (this.predefinedOps[operands[0]]) {
      return this.predefinedOps[operands[0]];
    }

    return this.type.decode(stream, parent, operands);
  }
}

class CFFEncodingVersion extends r.Number {
  constructor() {
    super('UInt8');
  }

  decode(stream: r.DecodeStream): number {
    return r.uint8.decode(stream) & 0x7f;
  }
}

const Range1 = new r.Struct({
  first: r.uint16,
  nLeft: r.uint8
});

const Range2 = new r.Struct({
  first: r.uint16,
  nLeft: r.uint16
});

const CFFCustomEncoding = new r.VersionedStruct(new CFFEncodingVersion(), {
  0: {
    nCodes: r.uint8,
    codes: new r.Array(r.uint8, 'nCodes')
  },

  1: {
    nRanges: r.uint8,
    ranges: new r.Array(Range1, 'nRanges')
  }

  // TODO: supplement?
});

const CFFEncoding = new PredefinedOp([ StandardEncoding, ExpertEncoding ], new CFFPointer(CFFCustomEncoding, { lazy: true }));

// Decodes an array of ranges until the total
// length is equal to the provided length.
class RangeArray extends r.Array {
  decode(stream: r.DecodeStream, parent: any): any[] {
    const length = resolveLength(this.length, stream, parent);
    let count = 0;
    const res: any[] = [];
    while (count < length) {
      const range = this.type.decode(stream, parent);
      range.offset = count;
      count += range.nLeft + 1;
      res.push(range);
    }

    return res;
  }
}

const getCharsetLength = t => t.parent.CharStrings.length - 1;
const CFFCustomCharset = new r.VersionedStruct(r.uint8, {
  0: {
    glyphs: new r.Array(r.uint16, getCharsetLength)
  },

  1: {
    ranges: new RangeArray(Range1, getCharsetLength)
  },

  2: {
    ranges: new RangeArray(Range2, getCharsetLength)
  }
});

const CFFCharset = new PredefinedOp([ ISOAdobeCharset, ExpertCharset, ExpertSubsetCharset ], new CFFPointer(CFFCustomCharset, {lazy: true}));

const FDRange3 = new r.Struct({
  first: r.uint16,
  fd: r.uint8
});

const FDRange4 = new r.Struct({
  first: r.uint32,
  fd: r.uint16
});

const FDSelect = new r.VersionedStruct(r.uint8, {
  0: {
    fds: new r.Array(r.uint8, t => t.parent.CharStrings.length)
  },

  3: {
    nRanges: r.uint16,
    ranges: new r.Array(FDRange3, 'nRanges'),
    sentinel: r.uint16
  },

  4: {
    nRanges: r.uint32,
    ranges: new r.Array(FDRange4, 'nRanges'),
    sentinel: r.uint32
  }
});

const ptr = new CFFPointer(CFFPrivateDict);
class CFFPrivateOp {
  decode(stream: r.DecodeStream, parent: any, operands: number[]): unknown {
    parent.length = operands[0];
    return ptr.decode(stream, parent, [operands[1]]);
  }
}

// key, name, type(s), default
const Private = [18, 'Private', new CFFPrivateOp, null] as const;
const FontName = [[12, 38], 'FontName', 'sid', null] as const;
const FontMatrix = [[12, 7], 'FontMatrix', 'array', [0.001, 0, 0, 0.001, 0, 0]] as const;
const PaintType = [[12, 5], 'PaintType', 'number', 0] as const;
const CharStrings = [17, 'CharStrings', new CFFPointer(new CFFIndex), null] as const;
const FDSelectEntry = [[12, 37], 'FDSelect', new CFFPointer(FDSelect), null] as const;

const FontDict = new CFFDict([Private, FontName, FontMatrix, PaintType]);

const FDArray = [[12, 36], 'FDArray', new CFFPointer(new CFFIndex(FontDict)), null] as const;

const CFFTopDict = new CFFDict([
  // key       name                   type(s)                                 default
  [[12, 30],  'ROS',                  ['sid', 'sid', 'number'],               null],

  [0,         'version',              'sid',                                  null],
  [1,         'Notice',               'sid',                                  null],
  [[12, 0],   'Copyright',            'sid',                                  null],
  [2,         'FullName',             'sid',                                  null],
  [3,         'FamilyName',           'sid',                                  null],
  [4,         'Weight',               'sid',                                  null],
  [[12, 1],   'isFixedPitch',         'boolean',                              false],
  [[12, 2],   'ItalicAngle',          'number',                               0],
  [[12, 3],   'UnderlinePosition',    'number',                               -100],
  [[12, 4],   'UnderlineThickness',   'number',                               50],
  PaintType,
  [[12, 6],   'CharstringType',       'number',                               2],
  FontMatrix,
  [13,        'UniqueID',             'number',                               null],
  [5,         'FontBBox',             'array',                                [0, 0, 0, 0]],
  [[12, 8],   'StrokeWidth',          'number',                               0],
  [14,        'XUID',                 'array',                                null],
  [15,        'charset',              CFFCharset,                             ISOAdobeCharset],
  [16,        'Encoding',             CFFEncoding,                            StandardEncoding],
  CharStrings,
  Private,
  [[12, 20],  'SyntheticBase',        'number',                               null],
  [[12, 21],  'PostScript',           'sid',                                  null],
  [[12, 22],  'BaseFontName',         'sid',                                  null],
  [[12, 23],  'BaseFontBlend',        'delta',                                null],

  // CID font specific
  [[12, 31],  'CIDFontVersion',       'number',                               0],
  [[12, 32],  'CIDFontRevision',      'number',                               0],
  [[12, 33],  'CIDFontType',          'number',                               0],
  [[12, 34],  'CIDCount',             'number',                               8720],
  [[12, 35],  'UIDBase',              'number',                               null],
  FDSelectEntry,
  FDArray,
  FontName
]);

const VariationStore = new r.Struct({
  length: r.uint16,
  itemVariationStore: ItemVariationStore
})

const CFF2TopDict = new CFFDict([
  FontMatrix,
  CharStrings,
  FDSelectEntry,
  FDArray,
  [24,        'vstore',               new CFFPointer(VariationStore),         null],
  [25,        'maxstack',             'number',                               193]
]);

const CFFTop = new r.VersionedStruct(r.fixed16, {
  1: {
    hdrSize:            r.uint8,
    offSize:            r.uint8,
    nameIndex:          new CFFIndex(new r.String('length')),
    topDictIndex:       new CFFIndex(CFFTopDict),
    stringIndex:        new CFFIndex(new r.String('length')),
    globalSubrIndex:    new CFFIndex
  },

  2: {
    hdrSize:            r.uint8,
    length:             r.uint16,
    topDict:            CFF2TopDict,
    globalSubrIndex:    new CFFIndex
  }
});

export default CFFTop;
