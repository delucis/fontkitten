import * as r from '@fontkitten/restructure';

const shortFrac = new r.Fixed(16, 14);

const Correspondence = new r.Struct({
  fromCoord: shortFrac,
  toCoord: shortFrac
});

const Segment = new r.Struct({
  pairCount: r.uint16,
  correspondence: new r.Array(Correspondence, 'pairCount')
});

export default new r.Struct({
  version: r.fixed32,
  axisCount: r.uint32,
  segment: new r.Array(Segment, 'axisCount')
});
