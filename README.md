# fontkitten

> [!WARNING]
> Work in progress. This library is under active development and the API may change significantly before its final release.

Fontkitten is a font data library based on the [fontkit](https://www.npmjs.com/package/fontkit) package. It offers a subset of fontkit's functionality, focusing on font file parsing and metadata extraction, and aims to be a lightweight alternative for projects that do not require the full feature set of fontkit.

## Usage with File System

Fontkitten works with `Buffer` objects. To load fonts from the file system, you'll need to read the file into a buffer and pass it to the `create` function.

```javascript
import { create } from 'fontkitten';
import fs from 'fs/promises';

const buffer = await fs.readFile('path/to/font.ttf');
const font = create(buffer);

// Or for a specific font in a collection:
const font = create(buffer, 'PostScriptName');
```
