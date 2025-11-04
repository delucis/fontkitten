import { DecodeStream } from 'restructure';

import TTFFont from './TTFFont';
import WOFFFont from './WOFFFont';
import WOFF2Font from './WOFF2Font';
import TrueTypeCollection from './TrueTypeCollection';
import DFont from './DFont';

import type { Font, FontCollection } from './types';
import type { CreateOptions } from './types-internal';

const formats = [TTFFont, WOFFFont, WOFF2Font, TrueTypeCollection, DFont];

export type CreateFn = (buffer: Buffer, postscriptName?: string) => Font | FontCollection;

export function makeCreate(options: CreateOptions): CreateFn {
	/**
	 * Returns a font object for the given buffer.
	 * For collection fonts (such as TrueType collection files), you can pass a postscriptName to get
	 * that font out of the collection instead of a collection object.
	 * @param buffer `Buffer` containing font data
	 * @param postscriptName Optional PostScript name of font to extract from collection file.
	 */
	return function create(buffer: Buffer, postscriptName?: string): Font | FontCollection {
		for (const format of formats) {
			if (format.probe(buffer)) {
				const font = new format(new DecodeStream(buffer), null, options);
				if (postscriptName) {
					return font.getFont(postscriptName);
				}

				return font;
			}
		}

		throw new Error('Unknown font format');
	};
}
