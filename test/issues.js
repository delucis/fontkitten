import { openSync } from 'fontkitten';

describe('issues', function () {
    describe('#282 - ReferenceError: Cannot access \'c3x\' before initialization', function () {
        it('should not throw a ReferenceError', function () {
            let font = openSync(new URL('data/PlayfairDisplay/PlayfairDisplay-Regular.otf', import.meta.url));

            let glyph = font.getGlyph(5);

            glyph.path;
        });
    });
});
