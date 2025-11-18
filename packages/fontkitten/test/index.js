import assert from 'assert';
import { open } from './helpers/util.js';
import { describe, it } from 'node:test';

describe('fontkitten', function () {
  it('should open a font from the file system', async () => {
    let font = await open(new URL('data/OpenSans/OpenSans-Regular.ttf', import.meta.url));
    assert.equal(font.type, 'TTF');
  });

  it('should open fonts of different formats', async () => {
    let font = await open(new URL('data/OpenSans/OpenSans-Regular.ttf', import.meta.url));
    assert.equal(font.type, 'TTF');

    font = await open(new URL('data/SourceSansPro/SourceSansPro-Regular.otf', import.meta.url));
    assert.equal(font.type, 'TTF');

    font = await open(new URL('data/NotoSans/NotoSans.ttc', import.meta.url));
    assert.equal(font.type, 'TTC');

    font = await open(new URL('data/NotoSans/NotoSans.ttc', import.meta.url), 'NotoSans');
    assert.equal(font.type, 'TTF');

    font = await open(new URL('data/NotoSans/NotoSans.dfont', import.meta.url));
    assert.equal(font.type, 'DFont');

    font = await open(new URL('data/NotoSans/NotoSans.dfont', import.meta.url), 'NotoSans');
    assert.equal(font.type, 'TTF');

    font = await open(new URL('data/SourceSansPro/SourceSansPro-Regular.woff', import.meta.url));
    assert.equal(font.type, 'WOFF');

    font = await open(new URL('data/SourceSansPro/SourceSansPro-Regular.woff2', import.meta.url));
    assert.equal(font.type, 'WOFF2');
  });

  it('should open fonts lacking PostScript name', async () => {
    let font = await open(new URL('data/Mada/Mada-Regular.subset1.ttf', import.meta.url));
    assert.equal(font.postscriptName, null);
  });

  it('should error when opening an invalid font asynchronously', async () => {
    await assert.rejects(
      open(new URL(import.meta.url)),
      { message: 'Unknown font format' }
    );
  });

  it('should error when opening an invalid font synchronously', async () => {
    await assert.rejects(async () => await open(new URL(import.meta.url)), /Unknown font format/);
  });

  it('should get collection objects for ttc fonts', async () => {
    let collection = await open(new URL('data/NotoSans/NotoSans.ttc', import.meta.url));
    assert.equal(collection.type, 'TTC');

    let names = collection.fonts.map(f => f.postscriptName);
    assert.deepEqual(names, ['NotoSans-Bold', 'NotoSans', 'NotoSans-Italic', 'NotoSans-BoldItalic']);

    let font = collection.getFont('NotoSans-Italic');
    return assert.equal(font.postscriptName, 'NotoSans-Italic');
  });

  it('should get collection objects for dfonts', async () => {
    let collection = await open(new URL('data/NotoSans/NotoSans.dfont', import.meta.url));
    assert.equal(collection.type, 'DFont');

    let names = collection.fonts.map(f => f.postscriptName);
    assert.deepEqual(names, ['NotoSans', 'NotoSans-Bold', 'NotoSans-Italic', 'NotoSans-BoldItalic']);

    let font = collection.getFont('NotoSans-Italic');
    return assert.equal(font.postscriptName, 'NotoSans-Italic');
  });
});
