import { DecodeStream } from 'restructure';
import TTFFont from './TTFFont';
import WOFFFont from './WOFFFont';
import WOFF2Font from './WOFF2Font';
import TrueTypeCollection from './TrueTypeCollection';
import DFont from './DFont';

const formats = [TTFFont, WOFFFont, WOFF2Font, TrueTypeCollection, DFont];

/**
 * Returns a font object for the given buffer.
 * For collection fonts (such as TrueType collection files), you can pass a postscriptName to get
 * that font out of the collection instead of a collection object.
 * @param buffer `Buffer` containing font data
 * @param postscriptName Optional PostScript name of font to extract from collection file.
 */
// TODO: Add proper return type
export function create(buffer: Buffer, postscriptName?: string) {
	for (const format of formats) {
		if (format.probe(buffer)) {
			const font = new format(new DecodeStream(buffer));
			if (postscriptName) {
				return font.getFont(postscriptName);
			}

			return font;
		}
	}

	throw new Error('Unknown font format');
}
