import { brotliDecompressSync } from 'node:zlib';
import { makeCreate, type CreateFn } from '@fontkitten/core';

export * from '@fontkitten/core/types';

/**
 * Returns a font object for the given buffer.
 * For collection fonts (such as TrueType collection files), you can pass a postscriptName to get
 * that font out of the collection instead of a collection object.
 * @param buffer `Buffer` containing font data
 * @param postscriptName Optional PostScript name of font to extract from collection file.
 */
export const create: CreateFn = makeCreate({
	decompressBrotli: (buffer: Buffer) => new Int8Array(brotliDecompressSync(buffer).buffer),
});
