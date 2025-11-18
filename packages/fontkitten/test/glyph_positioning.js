import { open } from './helpers/util.js';
import assert from 'assert';
import { describe, beforeEach, it } from 'node:test';

describe('glyph positioning', function () {
  describe('basic positioning', function () {
    let font;

    beforeEach(async () => {
      font = await open(new URL('data/SourceSansPro/SourceSansPro-Regular.otf', import.meta.url));
    });

    it('should get a glyph width', () => assert.equal(font.getGlyph(5).advanceWidth, 615));
  });
});
