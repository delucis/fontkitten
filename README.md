# fontkitten

> [!WARNING]
> Work in progress. This library is under active development and the API may change significantly before its final release.

Fontkitten is a font data library based on the [fontkit](https://www.npmjs.com/package/fontkit) package. It offers a subset of fontkit's functionality, focusing on font file parsing and metadata extraction, and aims to be a lightweight alternative for projects that do not require the full feature set of fontkit.

## Differences from Fontkit

### Usage with File System

Fontkitten does not include `open` and `openSync` utilities for loading fonts directly from the file system.

Instead, read a font from the file system yourself and pass it to the `create` function, which expects a `Buffer`:

```javascript
import { create } from 'fontkitten';
import fs from 'node:fs/promises';

const buffer = await fs.readFile('path/to/font.ttf');
const font = create(buffer);

// Or for a specific font in a collection:
const font = create(buffer, 'PostScriptName');
```

### Removed APIs

Fontkitten does not include the following Fontkit APIs on parsed fonts:

- `.setDefaultLanguage()` i18n support for font names
- `.createSubset()` subsetting support
- `.layout()` text layout and shaping
- `.stringsForGlyph()` reverse glyph mapping
- `.availableFeatures` and `.getAvailableFeatures()` APIs for detecting OpenType feature support
