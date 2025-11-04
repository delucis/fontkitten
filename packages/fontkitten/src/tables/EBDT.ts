import * as r from 'restructure';

export let BigMetrics = new r.Struct({
  height: r.uint8,
  width: r.uint8,
  horiBearingX: r.int8,
  horiBearingY: r.int8,
  horiAdvance: r.uint8,
  vertBearingX: r.int8,
  vertBearingY: r.int8,
  vertAdvance: r.uint8
});
