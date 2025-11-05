import {DecodeStream} from './DecodeStream.js';

export class EncodeStream {
  view: DataView;
  pos: number;

  constructor(public buffer: Uint8Array) {
    this.view = new DataView(this.buffer.buffer, this.buffer.byteOffset, this.buffer.byteLength);
    this.pos = 0;
  }

  writeUInt8(value: number): void {
    this.view.setUint8(this.pos, value);
    this.pos += DecodeStream.TYPES.UInt8;
  }
  writeUInt16BE(value: number): void {
    this.view.setUint16(this.pos, value);
    this.pos += DecodeStream.TYPES.UInt16;
  }
  writeInt16BE(value: number): void {
    this.view.setInt16(this.pos, value);
    this.pos += DecodeStream.TYPES.Int16;
  }
  writeInt32BE(value: number): void {
    this.view.setInt32(this.pos, value);
    this.pos += DecodeStream.TYPES.Int32;
  }
}
