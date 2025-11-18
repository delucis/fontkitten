import { open } from './helpers/util.js';
import assert from 'assert';
import { describe, beforeEach, it } from 'node:test';

describe('character to glyph mapping', function () {
  describe('basic cmap handling', () => {
    let font;

    beforeEach(async () => {
      font = await open(new URL('data/OpenSans/OpenSans-Regular.ttf', import.meta.url));
    });

    it('should get characterSet', function () {
      assert(Array.isArray(font.characterSet));
      return assert.equal(font.characterSet.length, 884);
    });

    it('should check if a character is supported', function () {
      assert(font.hasGlyphForCodePoint('a'.charCodeAt()));
      return assert(!font.hasGlyphForCodePoint(0));
    });

    it('should get a glyph for a character code', function () {
      let glyph = font.glyphForCodePoint('a'.charCodeAt());
      assert.equal(glyph.id, 68);
      return assert.deepEqual(glyph.codePoints, [97]);
    });

    it('should map a string to glyphs', function () {
      let glyphs = font.glyphsForString('hello', []);
      assert(Array.isArray(glyphs));
      assert.equal(glyphs.length, 5);
      assert.deepEqual(glyphs.map(g => g.id), [75, 72, 79, 79, 82]);
      return assert.deepEqual(glyphs.map(g => g.codePoints), [[104], [101], [108], [108], [111]]);
    });

    it('should support unicode variation selectors', async () => {
      let font = await open(new URL('data/fonttest/TestCMAP14.otf', import.meta.url));
      let glyphs = font.glyphsForString('\u{82a6}\u{82a6}\u{E0100}\u{82a6}\u{E0101}');
      assert.deepEqual(glyphs.map(g => g.id), [1, 1, 2]);
    });

    it('should support legacy encodings when no unicode cmap is found', async () => {
      let font = await open(new URL('data/fonttest/TestCMAPMacTurkish.ttf', import.meta.url));
      let glyphs = font.glyphsForString("“ABÇĞIİÖŞÜ”");
      assert.deepEqual(glyphs.map(g => g.id), [200, 34, 35, 126, 176, 42, 178, 140, 181, 145, 201]);
    });
  });
});
