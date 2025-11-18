import assert from 'node:assert';
import { describe, it, before } from 'node:test';
import { open } from './helpers/util.js';
import { basename, extname, join } from 'node:path';
import { readdirSync } from 'node:fs';

const fontFiles = readdirSync(new URL('data', import.meta.url), { withFileTypes: true })
	.filter((dirent) => dirent.isDirectory())
	.flatMap((dirent) => readdirSync(join(dirent.parentPath, dirent.name), { withFileTypes: true }))
	.filter((file) => file.isFile() && extname(file.name).match(/^\.(ttf|ttc|otf|dfont|woff2?)$/i))
	.map((file) => join(file.parentPath, file.name));

describe('APIs required for fontace and Capsize', () => {
	describe('precise testing of OpenSans TTF file', () => {
		/** @type {import('fontkitten').Font} */
		let font;
		before(async () => {
			font = await open(new URL('data/OpenSans/OpenSans-Regular.ttf', import.meta.url));
		});

		it('should have a type', () => {
			assert.equal(font.type, 'TTF');
		});
		it('should have names', () => {
			assert.equal(font.postscriptName, 'OpenSans');
			assert.equal(font.fullName, 'Open Sans');
			assert.equal(font.familyName, 'Open Sans');
		});
		it('should have metrics', () => {
			assert.equal(font.unitsPerEm, 2048);
			assert.equal(font.ascent, 2189);
			assert.equal(font.descent, -600);
			assert.equal(font.lineGap, 0);
			assert.equal(font.capHeight, 1462);
			assert.equal(font.xHeight, 1096);
			assert.equal(font.italicAngle, 0);
		});
		it('should have an OS/2 table', () => {
			assert.equal(font['OS/2'].usWeightClass, 400);
			assert.equal(font['OS/2'].xAvgCharWidth, 1206);
			assert.equal(font['OS/2'].fsSelection.bold, false);
			assert.equal(font['OS/2'].fsSelection.italic, false);
		});
		it('should have a character set', () => {
			assert(Array.isArray(font.characterSet));
			assert.equal(font.characterSet.includes(65), true); // 'A'
			assert.equal(font.characterSet.includes(8364), true); // '€'
			assert.equal(font.characterSet.includes(123456), false);
		});
		it('should have variation axes', () => {
			assert.equal(typeof font.variationAxes, 'object');
			assert.equal(Object.keys(font.variationAxes).length, 0);
		});
		it('should have glyphs with advanceWidth and isMark properties', () => {
			const glyphs = font.glyphsForString('A');
			assert.equal(glyphs[0].id, 36);
			assert.equal(glyphs[0].advanceWidth, 1296);
			assert.equal(glyphs[0].isMark, false);
		});
	});

	fontFiles.forEach((fontPath) => {
		describe(basename(fontPath), () => {
			/** @type {import('fontkitten').Font} */
			let font;
			before(async () => {
				const fontOrCollection = await open(fontPath);
				// For collections, just test the first font
				// @ts-expect-error
				font = fontOrCollection.fonts?.[0] || fontOrCollection;
			});
			describe('APIs', () => {
				it('should have a type', () => {
					assert.equal(typeof font.type, 'string');
				});
				it('should have names', () => {
					assert(typeof font.postscriptName === 'string' || font.postscriptName === null);
					assert(typeof font.fullName === 'string' || font.fullName === null);
					assert.equal(typeof font.familyName, 'string');
				});
				it('should have metrics', () => {
					assert.equal(typeof font.unitsPerEm, 'number');
					assert.equal(typeof font.ascent, 'number');
					assert.equal(typeof font.descent, 'number');
					assert.equal(typeof font.lineGap, 'number');
					assert.equal(typeof font.capHeight, 'number');
					assert.equal(typeof font.xHeight, 'number');
					assert.equal(typeof font.italicAngle, 'number');
				});
				it('should have an OS/2 table', () => {
					assert.equal(typeof font['OS/2'].usWeightClass, 'number');
					assert.equal(typeof font['OS/2'].xAvgCharWidth, 'number');
					assert.equal(typeof font['OS/2'].fsSelection.bold, 'boolean');
					assert.equal(typeof font['OS/2'].fsSelection.italic, 'boolean');
				});
				it('should have a character set', () => {
					assert(Array.isArray(font.characterSet));
					// All entries in characterSet are numbers
					assert.deepEqual([...new Set(font.characterSet.map((c) => typeof c))], ['number']);
				});
				it('should have variation axes', () => {
					assert(font.variationAxes);
					assert.equal(typeof font.variationAxes, 'object');
				});
				it('should have glyphs with advanceWidth and isMark properties', () => {
					const glyphs = font.glyphsForString('A');
					assert.equal(typeof glyphs[0].advanceWidth, 'number');
					assert.equal(typeof glyphs[0].isMark, 'boolean');
				});
			});
			describe('Compatibility with ecosystem packages', () => {
				it('should work with @capsizecss/unpack', () => {
					const metrics = unpackMetricsFromFont(font);
					assert.equal(typeof metrics.ascent, 'number');
					assert.equal(typeof metrics.capHeight, 'number');
					assert.equal(typeof metrics.descent, 'number');
					assert.equal(typeof metrics.familyName, 'string');
					assert(typeof metrics.fullName === 'string' || metrics.fullName === null);
					assert.equal(typeof metrics.lineGap, 'number');
					assert(typeof metrics.postscriptName === 'string' || metrics.postscriptName === null);
					assert.equal(typeof metrics.unitsPerEm, 'number');
					assert.equal(typeof metrics.xHeight, 'number');
					assert.equal(typeof metrics.xWidthAvg, 'number');
				});

				it('should work with fontace', () => {
					const info = fontace(font);
					assert.equal(typeof info.family, 'string');
					assert.equal(typeof info.style, 'string');
					assert.equal(typeof info.weight, 'string');
					assert.equal(typeof info.format, 'string');
					assert.equal(typeof info.isVariable, 'boolean');
					assert.equal(typeof info.unicodeRange, 'string');
					assert(Array.isArray(info.unicodeRangeArray));
					assert.deepEqual([...new Set(info.unicodeRangeArray.map((r) => typeof r))], ['string']);
				});
			});
		});
	});
});

// -----------------------------------------------------------------------
// @CAPSIZECSS/UNPACK COMPATIBILITY
// Inlined capsize CSS helper functions below
// -----------------------------------------------------------------------

// prettier-ignore
const weightings = {
	latin: {0:0.0053,1:0.0023,2:0.0026,3:0.001,4:8e-4,5:0.0015,6:7e-4,7:5e-4,8:7e-4,9:6e-4,',':0.0083,' ':0.154,t:0.0672,h:0.0351,e:0.0922,o:0.0571,f:0.017,P:0.0023,p:0.0163,l:0.0304,"'":0.0014,s:0.0469,R:0.0015,u:0.0207,b:0.0114,i:0.0588,c:0.0232,C:0.0031,n:0.0578,a:0.0668,d:0.0298,y:0.0123,w:0.011,B:0.002,r:0.0526,z:0.0011,G:0.0011,j:9e-4,T:0.0041,'.':0.0079,L:0.0012,k:0.0046,m:0.0181,']':7e-4,J:9e-4,F:0.0015,v:0.0076,g:0.0155,A:0.004,N:0.0014,'-':0.0018,H:0.0013,D:0.0013,M:0.0025,I:0.0022,E:0.0011,'"':0.0012,S:0.0041,'(':0.001,')':0.001,x:0.0025,W:0.0012,Q:1e-4,Y:3e-4,q:8e-4,V:5e-4,á:1e-4,K:7e-4,U:0.0016,'=':7e-4,'[':0.0021,O:9e-4,é:1e-4,$:2e-4,':':8e-4,'|':0.0038,'/':1e-4,'%':1e-4,Z:2e-4,';':1e-4,X:1e-4},
	thai:{ส:0.0258,ว:0.0372,น:0.0711,บ:0.0258,จ:0.0169,า:0.1024,ก:0.0552,เ:0.0419,ร:0.0873,ม:0.0416,ค:0.0214,ำ:0.0097,ข:0.0127,อ:0.0459,ป:0.0204,ด:0.0271,ใ:0.0109,ภ:0.0046,ท:0.0311,พ:0.0175,ฤ:9e-4,ษ:0.0042,ศ:0.0063,ะ:0.0255,ช:0.0158,แ:0.0158,ล:0.0339,ง:0.0433,ย:0.0345,ห:0.0197,ฝ:6e-4,ต:0.0239,โ:0.0077,ญ:0.0039,ณ:0.0071,ผ:0.0077,ไ:0.0111,ฯ:7e-4,ฟ:0.0044,ธ:0.0068,ถ:0.0061,ฐ:0.0033,ซ:0.0046,ฉ:0.0023,ฑ:4e-4,ฆ:2e-4,ฬ:3e-4,ฏ:2e-4,ฎ:3e-4,ฒ:0.0012,ๆ:3e-4,ฮ:4e-4,'๒':1e-4,'๕':1e-4}
};
const supportedSubsets = Object.keys(weightings);

/**
 *
 * @param {keyof (typeof weightings)[keyof typeof weightings]} character
 * @param {keyof typeof weightings} subset
 * @returns
 */
const weightingForCharacter = (character, subset) => {
	if (!Object.keys(weightings[subset]).includes(character)) {
		throw new Error(`No weighting specified for character: “${character}”`);
	}
	return weightings[subset][character];
};

/**
 * @param {import('fontkitten').Font} font
 * @param {keyof typeof weightings} subset
 */
const avgWidthForSubset = (font, subset) => {
	const sampleString = Object.keys(weightings[subset]).join('');
	const glyphs = font.glyphsForString(sampleString);
	const weightedWidth = glyphs.reduce((sum, glyph, index) => {
		const character = sampleString.charAt(index);

		let charWidth = font['OS/2'].xAvgCharWidth;
		try {
			charWidth = glyph.advanceWidth;
		} catch (e) {
			console.warn(
				`Couldn’t read 'advanceWidth' for character “${
					character === ' ' ? '<space>' : character
				}” from “${font.familyName}”. Falling back to “xAvgCharWidth”.`
			);
		}

		if (glyph.isMark) {
			return sum;
		}

		return sum + charWidth * weightingForCharacter(character, subset);
	}, 0);

	return Math.round(weightedWidth);
};

/**
 * @param {import('fontkitten').Font} font
 */
const unpackMetricsFromFont = (font) => {
	const {
		capHeight,
		ascent,
		descent,
		lineGap,
		unitsPerEm,
		familyName,
		fullName,
		postscriptName,
		xHeight,
	} = font;

	const subsets = supportedSubsets.reduce(
		(acc, subset) => ({
			...acc,
			[subset]: {
				xWidthAvg: avgWidthForSubset(font, subset),
			},
		}),
		{}
	);

	return {
		familyName,
		fullName,
		postscriptName,
		capHeight,
		ascent,
		descent,
		lineGap,
		unitsPerEm,
		xHeight,
		xWidthAvg: subsets.latin.xWidthAvg,
		subsets,
	};
};

// -----------------------------------------------------------------------
// FONTACE COMPATIBILITY
// Inlined fontace functions below
// -----------------------------------------------------------------------

/**
 * @param {import('fontkitten').Font} font
 */
function getWeight(font) {
	if (font.variationAxes.wght) {
		return `${font.variationAxes.wght.min} ${font.variationAxes.wght.max}`;
	}
	const weight = font['OS/2']?.usWeightClass || (font['OS/2']?.fsSelection?.['bold'] ? 700 : 400);
	return `${weight}`;
}
/**
 * @param {import('fontkitten').Font} font
 */
function getStyle(font) {
	return font['OS/2']?.fsSelection?.italic || font.italicAngle !== 0 ? 'italic' : 'normal';
}
/**
 * @param {import('fontkitten').Font} font
 */
function fontace(font) {
	return {
		...getUnicodeRange(font),
		family: font.familyName,
		style: getStyle(font),
		weight: getWeight(font),
		format: { TTF: 'truetype', WOFF: 'woff', WOFF2: 'woff2' }[font.type],
		isVariable: Object.keys(font.variationAxes).length > 0,
	};
}
/**
 * @param {import('fontkitten').Font} font
 */
function getUnicodeRange({ characterSet }) {
	if (!characterSet || characterSet.length === 0) {
		const defaultRange = 'U+0-10FFFF';
		return { unicodeRange: defaultRange, unicodeRangeArray: [defaultRange] };
	}
	characterSet.sort((a, b) => a - b);
	const ranges = [];
	let start = characterSet[0];
	let end = start;
	for (let i = 1; i < characterSet.length; i++) {
		if (characterSet[i] === end + 1) {
			end = characterSet[i];
		} else {
			ranges.push(formatRange(start, end));
			start = characterSet[i];
			end = start;
		}
	}
	ranges.push(formatRange(start, end));
	return { unicodeRange: ranges.join(', '), unicodeRangeArray: ranges };
}
/**
 * @param {number} start
 * @param {number} end
 */
function formatRange(start, end) {
	return start === end
		? `U+${start.toString(16).toUpperCase()}`
		: `U+${start.toString(16).toUpperCase()}-${end.toString(16).toUpperCase()}`;
}
