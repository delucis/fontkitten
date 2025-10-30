import * as r from 'restructure';
import inflate from 'tiny-inflate';
import TTFFont from './TTFFont';
import WOFFDirectory from './tables/WOFFDirectory';
import { asciiDecoder } from './utils';

export default class WOFFFont extends TTFFont {
  type: TTFFont['type'] = 'WOFF';

  static probe(buffer: Buffer): boolean {
    return asciiDecoder.decode(buffer.slice(0, 4)) === 'wOFF';
  }

  _decodeDirectory(): void {
    this.directory = WOFFDirectory.decode(this.stream, { _startOffset: 0 });
  }

  _getTableStream(tag: string): any {
    let table = this.directory.tables[tag];
    if (table) {
      this.stream.pos = table.offset;

      if (table.compLength < table.length) {
        this.stream.pos += 2; // skip deflate header
        let outBuffer = new Uint8Array(table.length);
        let buf = inflate(this.stream.readBuffer(table.compLength - 2), outBuffer);
        return new r.DecodeStream(buf);
      } else {
        return this.stream;
      }
    }

    return null;
  }
}
