import * as r from '@fontkitten/restructure';

// Set of instructions executed whenever the point size or font transformation change
export default new r.Struct({
  controlValueProgram: new r.Array(r.uint8)
});
