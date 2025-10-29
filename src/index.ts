import { DecodeStream } from 'restructure';
import TTFFont from './TTFFont';
import WOFFFont from './WOFFFont';
import WOFF2Font from './WOFF2Font';
import TrueTypeCollection from './TrueTypeCollection';
import DFont from './DFont';

const formats = [TTFFont, WOFFFont, WOFF2Font, TrueTypeCollection, DFont];

export function create(buffer, postscriptName) {
	for (let i = 0; i < formats.length; i++) {
		let format = formats[i];
		if (format.probe(buffer)) {
			let font = new format(new DecodeStream(buffer));
			if (postscriptName) {
				return font.getFont(postscriptName);
			}

			return font;
		}
	}

	throw new Error('Unknown font format');
}
