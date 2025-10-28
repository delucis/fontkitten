import { openSync } from 'fontkitten';
import assert from 'assert';

describe('glyph positioning', function () {
  describe('basic positioning', function () {
    let font = openSync(new URL('data/SourceSansPro/SourceSansPro-Regular.otf', import.meta.url));

    it('should get a glyph width', () => assert.equal(font.getGlyph(5).advanceWidth, 615));
  });
});
