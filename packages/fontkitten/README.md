<h1 align="center">fontkitten</h1>
<p align="center">A smaller font file parser</p>
<p align="center">
  <a href="https://www.npmjs.com/package/fontkitten"><img alt="fontkitten on NPM" src="https://img.shields.io/npm/v/fontkitten"></a>
  <a href="https://github.com/delucis/fontkitten/actions/workflows/ci.yml"><img src="https://github.com/delucis/fontkitten/actions/workflows/ci.yml/badge.svg" alt="CI status"></a>
</p>

> [!WARNING]
> Work in progress. This library is under active development and the API may change slightly before its final release.

Fontkitten is a font data library, focused on font file parsing and metadata extraction.

- 18x smaller install size than `fontkit`
- Drop-in replacement for the supported APIs
- Built-in TypeScript types

Based on the [`fontkit`](https://www.npmjs.com/package/fontkit) package, Fontkitten aims to offer a lighter weight alternative for projects that do not require the full feature set of `fontkit`.
See [“Differences from Fontkit”](#differences-from-fontkit) below for full details of changed APIs.

## Installation

```sh
npm install fontkitten
```

## Differences from Fontkit

### Usage with File System

Fontkitten does not include `open` and `openSync` utilities for loading fonts directly from the file system.

Instead, read a font from the file system yourself and pass it to the `create` function, which expects a `Buffer`. See the [`create()` documentation](#createbuffer-postscriptname) for an example.

### Removed APIs

Fontkitten does not include the following Fontkit APIs on parsed fonts:

- `.setDefaultLanguage()` i18n support for font names
- `.createSubset()` subsetting support
- `.layout()` text layout and shaping
- `.stringsForGlyph()` reverse glyph mapping
- `.availableFeatures` and `.getAvailableFeatures()` APIs for detecting OpenType feature support

## API

### `create(buffer, postscriptName?)`

Use the `create` function to create a [`Font`](#font-objects) object for the given font buffer:

```javascript
import { create } from 'fontkitten';
import fs from 'node:fs/promises';

const buffer = await fs.readFile('path/to/font.ttf');
const font = create(buffer);
```

For collection fonts (such as `.ttc` TrueType collection files), `create` will return a [`FontCollection`](#font-collection-objects) object, unless you pass a PostScript name to get a specific font from the collection:

```javascript
const buffer = await fs.readFile('path/to/collection.ttc');
const collection = create(buffer);
const font = create(buffer, 'PostScriptName');
```

### `Font` objects

The core of the `fontkitten` API is the `Font` object, which represents a parsed font file.
You can use this object to access font metadata, glyph data, and other information about the font.

#### Metadata properties

The following properties are strings (or null if the font does not contain strings for them) describing the font, as specified by the font creator.

- `postscriptName`
- `fullName`
- `familyName`
- `subfamilyName`
- `copyright`
- `version`

#### Metrics

The following properties describe the general metrics of the font. See [here](http://www.freetype.org/freetype2/docs/glyphs/glyphs-3.html) for a good overview of how all of these properties relate to one another.

- `unitsPerEm` - the size of the font’s internal coordinate grid
- `ascent` - the font’s [ascender](<http://en.wikipedia.org/wiki/Ascender_(typography)>)
- `descent` - the font’s [descender](http://en.wikipedia.org/wiki/Descender)
- `lineGap` - the amount of space that should be included between lines
- `underlinePosition` - the offset from the normal underline position that should be used
- `underlineThickness` - the weight of the underline that should be used
- `italicAngle` - if this is an italic font, the angle the cursor should be drawn at to match the font design
- `capHeight` - the height of capital letters above the baseline. See [here](http://en.wikipedia.org/wiki/Cap_height) for more details.
- `xHeight`- the height of lower case letters. See [here](http://en.wikipedia.org/wiki/X-height) for more details.
- `bbox` - the font’s bounding box, i.e. the box that encloses all glyphs in the font

#### Other properties

- `numGlyphs` - the number of glyphs in the font
- `characterSet` - an array of all of the unicode code points supported by the font

#### Character to glyph mapping

Fontkitten includes several methods for character-to-glyph mapping.

##### `font.glyphForCodePoint(codePoint)`

Maps a single unicode code point (number) to a [`Glyph`](#glyph-objects) object. Does not perform any advanced substitutions.

##### `font.hasGlyphForCodePoint(codePoint)`

Returns whether there is glyph in the font for the given unicode code point.

##### `font.glyphsForString(string)`

This method returns an array of [`Glyph`](#glyph-objects) objects for the given string. This is only a one-to-one mapping from characters
to glyphs and does not provide the more advanced mapping supported by Fontkit’s `layout()` method.

#### Variation fonts

Fontkitten has support for AAT variation fonts, where glyphs can adjust their shape according to user-defined settings along
various axes including weight, width, and slant. Font designers specify the minimum, default, and maximum values for each
axis they support, and allow the user fine-grained control over the rendered text.

##### `font.variationAxes`

Returns an object describing the available variation axes. Keys are 4-letter axis tags, and values include `name`,
`min`, `default`, and `max` properties for the axis.

##### `font.namedVariations`

The font designer may have picked out some variations that they think look particularly good, for example a light, regular,
and bold weight which would traditionally be separate fonts. This property returns an object describing these named variation
instances that the designer has specified. Keys are variation names, and values are objects with axis settings.

##### `font.getVariation(variation)`

Returns a new font object representing this variation, from which you can get glyphs as normal.
The `variation` parameter can either be a variation settings object or a string variation name. Variation settings objects
have axis names as keys, and numbers as values (should be in the range specified by `font.variationAxes`).

#### Other methods

##### `font.getGlyph(glyph_id, codePoints = [])`

Returns a glyph object for the given glyph id. You can pass the array of code points this glyph represents for your use later, and it will be stored in the glyph object.

### `FontCollection` objects

For font collection files that contain multiple fonts in a single file, such as TrueType Collection (`.ttc`) and Datafork TrueType (`.dfont`) files, a `FontCollection` object can be returned by Fontkitten.

#### `collection.getFont(postscriptName)`

Gets a font from the collection by its postscript name. Returns a Font object, described above.

#### `collection.fonts`

This property is a lazily-loaded array of all of the fonts in the collection.

### `Glyph` objects

`Glyph` objects represent a glyph in the font. They have various properties for accessing metrics and the actual vector path the glyph represents, and methods for rendering the glyph to a graphics context.

You do not create glyph objects directly. They are created by various methods on the [`Font`](#font-objects) object, described above. `Glyph` objects include the following API.

#### Properties

- `id` - the glyph id in the font
- `name` - the glyph name in the font
- `codePoints` - an array of unicode code points that are represented by this glyph. There can be multiple code points in the case of ligatures and other glyphs that represent multiple visual characters.
- `path` - a vector [`Path`](#path-objects) object representing the glyph
- `bbox` - the glyph’s bounding box, i.e. the rectangle that encloses the glyph outline as tightly as possible.
- `cbox` - the glyph’s control box. This is often the same as the bounding box, but is faster to compute. Because of the way bezier curves are defined, some of the control points can be outside of the bounding box. Where `bbox` takes this into account, `cbox` does not. Thus, `cbox` is less accurate, but faster to compute. See [here](http://www.freetype.org/freetype2/docs/glyphs/glyphs-6.html#section-2) for a more detailed description.
- `advanceWidth` - the glyph’s advance width.

#### Methods

##### `glyph.render(ctx, fontSize)`

Renders the glyph to the given `Canvas` rendering context, at the specified font size.

#### Color glyphs (e.g. emoji)

Fontkitten has support for several different color emoji font formats. Currently, these include Apple’s SBIX table (as used by the “Apple Color Emoji” font), and Microsoft’s COLR table (supported by Windows 8.1).

##### `glyph.getImageForSize(size)`

For SBIX glyphs, which are bitmap based, this returns an object containing some properties about the image, along with the image data itself (usually PNG).

##### `glyph.layers`

For COLR glyphs, which are vector based, this returns an array of objects representing the glyphs and colors for each layer in render order.

### `Path` objects

`Path` objects are returned by glyphs and represent the actual vector outlines for each glyph in the font. Paths can be converted to SVG path data strings, or to functions that can be applied to render the path to a graphics context.

#### `path.moveTo(x, y)`

Moves the virtual pen to the given x, y coordinates.

#### `path.lineTo(x, y)`

Adds a line to the path from the current point to the given x, y coordinates.

#### `path.quadraticCurveTo(cpx, cpy, x, y)`

Adds a quadratic curve to the path from the current point to the given x, y coordinates using cpx, cpy as a control point.

#### `path.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y)`

Adds a bezier curve to the path from the current point to the given x, y coordinates using cp1x, cp1y and cp2x, cp2y as control points.

#### `path.closePath()`

Closes the current sub-path by drawing a straight line back to the starting point.

#### `path.toFunction()`

Compiles the path to a JavaScript function that can be applied with a `Canvas` rendering context in order to render the path.

#### `path.toSVG()`

Converts the path to an SVG path data string.

#### `path.bbox`

This property represents the path’s bounding box, i.e. the smallest rectangle that contains the entire path shape. This is the exact bounding box, taking into account control points that may be outside the visible shape.

#### `path.cbox`

This property represents the path’s control box. It is like the bounding box, but it includes all points of the path, including control points of bezier segments. It is much faster to compute than the real bounding box, but less accurate if there are control points outside of the visible shape.

## License

MIT
