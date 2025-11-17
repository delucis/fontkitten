import { create } from 'fontkitten';
import { readdirSync, readFileSync } from 'fs';
import { describe, it } from 'mocha';
import assert from 'node:assert';

const dataDir = new URL('./data/', import.meta.url);
const fontDirs = readdirSync(dataDir, { withFileTypes: true });
const fontPaths = fontDirs.flatMap((file) =>
	file.isDirectory()
		? readdirSync(new URL(`./data/${file.name}/`, import.meta.url))
				.filter((f) => /\.(ttf|otf|ttc|dfont|woff|woff2)$/i.test(f))
				.map((f) => new URL(`./data/${file.name}/${f}`, import.meta.url))
		: []
);
const fontFiles = fontPaths.map(
	(url) => /** @type {[string, Buffer]} */ ([url.pathname.split('/').pop(), readFileSync(url)])
);

describe('fontkitten fuzz tests', () => {
	fontFiles.forEach(([fileName, data]) => {
		describe(fileName, () => {
			/** @type {import('fontkitten').Font | import('fontkitten').FontCollection} */
			let font;
			it(`should create a font object`, () => {
				font = create(data);
				assert(font);
			});
			it(`should have a type string`, () => {
				assert.ok(['TTF', 'WOFF', 'WOFF2', 'TTC', 'DFont'].includes(font.type));
			});
			it('should have a font instance with the expected API', () => {
				if (font.isCollection) {
					// Collection fonts
					// Contain an array of fonts
					assert(Array.isArray(font.fonts));
					assert(font.fonts.length > 0);

					// #isCollection
					assert.equal(font.isCollection, true);

					// #getFont()
					const firstPSName = font.fonts[0].postscriptName;
					const firstFont = font.getFont(firstPSName);
					assert(firstFont);
					assert.equal(firstFont.postscriptName, firstPSName);

					// Each font in the collection should have the same API as regular fonts
					font.fonts.forEach(testFont);
				} else {
					// Regular fonts
					testFont(font);
				}
			});
		});
	});
});

/**
 * @param {import('fontkitten').Font} instance
 */
function testFont(instance) {
	// #getName()
	const fullName = instance.getName('fullName');
	assert(typeof fullName === 'string' || fullName === null);

	// #isCollection
	assert.equal(instance.isCollection, false);

	// #namedVariations
	assert(instance.namedVariations);
	assert.equal(typeof instance.namedVariations, 'object');
	for (const variation of Object.values(instance.namedVariations)) {
		for (const [param, value] of Object.entries(variation)) {
			assert(typeof param === 'string');
			assert(typeof value === 'number');
		}
	}

	// #getVariation() and #getFont()
	for (const name in instance.namedVariations) {
		const fontVariation = instance.getFont(name);
		const variation = instance.getVariation(name);
		assert(variation);
		assert.deepEqual(fontVariation, variation);
	}

	// #variationAxes
	for (const axisName in instance.variationAxes) {
		const axis = instance.variationAxes[axisName];
		assert(axis);
		assert(typeof axis.name === 'string');
		assert.equal(typeof axis.min, 'number');
		assert.equal(typeof axis.max, 'number');
		assert.equal(typeof axis.default, 'number');
	}

	// #glyphForCodePoint()
	const aGlyph = instance.glyphForCodePoint(65); // 'A'
	assert(aGlyph);
	assert.equal(typeof aGlyph.id, 'number');
	const smileyGlyph = instance.glyphForCodePoint(0x1f600); // 😀
	assert(smileyGlyph);
	assert.equal(typeof smileyGlyph.id, 'number');

	// #glyphsForString()
	const glyphs = instance.glyphsForString('Hello, World!');
	assert(Array.isArray(glyphs));
	assert(glyphs.length > 0);
	glyphs.forEach((glyph) => {
		assert.equal(typeof glyph.id, 'number');
	});

	// #hasGlyphForCodePoint()
	assert.equal(typeof instance.hasGlyphForCodePoint(65), 'boolean');

	// #getGlyph()
	assert.doesNotThrow(() => {
		instance.getGlyph(0);
		instance.getGlyph(Math.ceil(Math.random() * 1000));
		instance.getGlyph(2013);
	});

	// Glyphs
	for (const codepoint of instance.characterSet) {
		// Test a random sample of ~50 codepoints per font.
		const targetSampleSize = Math.min(50, instance.characterSet.length);
		if (Math.random() > 1 / (instance.characterSet.length / targetSampleSize)) {
			continue;
		}
		// TODO: investigate a fix for this infinite recursion.
		if (instance.postscriptName === 'SSEmoji-Beta' && [0, 13, 32].includes(codepoint)) {
			continue; // Infinite recursion for these codepoints in `ss-emoji-microsoft.ttf`.
		}
		const glyph = instance.glyphForCodePoint(codepoint);
		testGlyph(glyph);
	}

	// Name properties
	for (const prop of /** @type {const} */ ([
		'familyName',
		'subfamilyName',
		'postscriptName',
		'fullName',
		'copyright',
		'version',
	])) {
		// TODO: Some fonts dont’t have one of these so it returns null, but this is not reflected in types.
		assert(typeof instance[prop] === 'string' || instance[prop] === null);
	}

	// #numGlyphs
	assert.equal(typeof instance.numGlyphs, 'number');
	assert(instance.numGlyphs > 0);

	// #characterSet
	assert(Array.isArray(instance.characterSet));
	assert(instance.characterSet.length > 0);
	instance.characterSet.forEach((codePoint) => {
		assert.equal(typeof codePoint, 'number');
	});

	// Numeric metrics properties
	/** @type {const} */ ([
		'ascent',
		'descent',
		'lineGap',
		'underlinePosition',
		'underlineThickness',
		'capHeight',
		'italicAngle',
		'unitsPerEm',
		'xHeight',
	]).forEach((prop) => {
		assert.equal(typeof instance[prop], 'number');
	});
	// HHEA table properties
	/** @type {const} */ ([
		'advanceWidthMax',
		'ascent',
		'caretOffset',
		'caretSlopeRise',
		'caretSlopeRun',
		'descent',
		'lineGap',
		'metricDataFormat',
		'minLeftSideBearing',
		'minRightSideBearing',
		'numberOfMetrics',
		'version',
		'xMaxExtent',
	]).forEach((prop) => {
		assert.equal(typeof instance.hhea[prop], 'number');
	});
	// Bounding box properties
	/** @type {const} */ (['height', 'width', 'maxX', 'maxY', 'minX', 'minY']).forEach((prop) => {
		assert.equal(typeof instance.bbox[prop], 'number');
	});
	// OS/2 table properties
	/** @type {const} */ ([
		'breakChar',
		'capHeight',
		'defaultChar',
		'maxContent',
		'sFamilyClass',
		'typoAscender',
		'typoDescender',
		'typoLineGap',
		'usFirstCharIndex',
		'usLastCharIndex',
		'usWeightClass',
		'usWidthClass',
		'version',
		'winAscent',
		'winDescent',
		'xAvgCharWidth',
		'xHeight',
		'yStrikeoutPosition',
		'yStrikeoutSize',
		'ySubscriptXOffset',
		'ySubscriptXSize',
		'ySubscriptYOffset',
		'ySubscriptYSize',
		'ySuperscriptXOffset',
		'ySuperscriptXSize',
		'ySuperscriptYOffset',
		'ySuperscriptYSize',
	]).forEach((prop) => {
		assert.equal(typeof instance['OS/2'][prop], 'number');
	});
}

/**
 * @param {import('fontkitten').Glyph} glyph
 */
function testGlyph(glyph) {
	assert(glyph);
	// Glyph properties
	assert.equal(typeof glyph.id, 'number', 'glyph.id should be a number');
	assert.equal(typeof glyph.advanceWidth, 'number', 'glyph.advanceWidth should be a number');
	assert.equal(typeof glyph.advanceHeight, 'number', 'glyph.advanceHeight should be a number');
	assert.equal(typeof glyph.isLigature, 'boolean', 'glyph.isLigature should be a boolean');
	assert.equal(typeof glyph.isMark, 'boolean', 'glyph.isMark should be a boolean');
	// TODO: Glyph name is typed as a string but can be null or undefined in practice.
	assert(
		typeof glyph.name === 'string' || glyph.name === null || glyph.name === undefined,
		'glyph.name should be a string'
	);
	// Glyph#bbox
	assert.equal(typeof glyph.bbox, 'object', 'glyph.bbox should be an object');
	/** @type {const} */ (['width', 'height', 'maxX', 'maxY', 'minX', 'minY']).forEach((prop) => {
		assert.equal(typeof glyph.bbox[prop], 'number', `glyph.bbox.${prop} should be a number`);
	});
	// Glyph#cbox
	assert.equal(typeof glyph.cbox, 'object', 'glyph.cbox should be an object');
	/** @type {const} */ (['width', 'height', 'maxX', 'maxY', 'minX', 'minY']).forEach((prop) => {
		assert.equal(typeof glyph.cbox[prop], 'number', `glyph.cbox.${prop} should be a number`);
	});
	// Glyph#codePoints
	assert(Array.isArray(glyph.codePoints), 'glyph.codePoints should be an array');
	// Glyph#path
	testPath(glyph.path);
}

/**
 * @param {import('fontkitten').Path} path
 */
function testPath(path) {
	assert.equal(typeof path, 'object', 'path should be an object');
	// Path#commands
	assert(Array.isArray(path.commands), 'path.commands should be an array');
	path.commands.forEach((command) => {
		assert.equal(typeof command.command, 'string', 'path.commands.command should be a string');
		assert(Array.isArray(command.args), 'path.commands.args should be an array');
		command.args.forEach((arg) => {
			assert.equal(typeof arg, 'number', 'path.commands.args[n] should be a number');
		});
	});
	// Path#rotate(), #scale(), #translate()
	assert.deepEqual(path.commands, path.rotate(0).commands);
	assert.deepEqual(path.commands, path.scale(1).commands);
	assert.deepEqual(path.commands, path.translate(0, 0).commands);
	// Path#toSVG()
	assert.equal(typeof path.toSVG(), 'string', 'path.toSVG() should return a string');
}
