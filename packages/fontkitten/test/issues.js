import { open } from './helpers/util.js';
import { describe, it } from 'node:test';

describe('issues', function () {
    describe('#282 - ReferenceError: Cannot access \'c3x\' before initialization', function () {
        it('should not throw a ReferenceError', async () => {
            const font = await open(new URL('data/PlayfairDisplay/PlayfairDisplay-Regular.otf', import.meta.url));

            const glyph = font.getGlyph(5);

            glyph.path;
        });
    });
});
