export class DecodeStream {
  #view: DataView;
  pos: number;
  length: number;

  constructor(public buffer: Uint8Array) {
    this.#view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    this.pos = 0;
    this.length = buffer.length;
  }

  readString(length: number, encoding: string = 'ascii'): string {
    const buf = this.readBuffer(length);
    return new TextDecoder(encoding).decode(buf);
  }

  readBuffer(length: number): Uint8Array {
    return this.buffer.slice(this.pos, (this.pos += length));
  }

  readUInt8(): number {
    const ret = this.#view.getUint8(this.pos);
    this.pos += DecodeStream.TYPES.UInt8;
    return ret;
  }

  readUInt16BE(): number {
    const ret = this.#view.getUint16(this.pos);
    this.pos += DecodeStream.TYPES.UInt16;
    return ret;
  }

  readUInt32BE(): number {
    const ret = this.#view.getUint32(this.pos);
    this.pos += DecodeStream.TYPES.UInt32;
    return ret;
  }

  readInt8(): number {
    const ret = this.#view.getInt8(this.pos);
    this.pos += DecodeStream.TYPES.Int8;
    return ret;
  }

  readInt16BE(): number {
    const ret = this.#view.getInt16(this.pos);
    this.pos += DecodeStream.TYPES.Int16;
    return ret;
  }

  readUInt24BE(): number {
    return (this.readUInt16BE() << 8) + this.readUInt8();
  }

  readInt32BE(): number {
    const ret = this.#view.getInt32(this.pos);
    this.pos += DecodeStream.TYPES.Int32;
    return ret;
  }
  
  static TYPES: Record<string, number> = {
    UInt8: 1,
    UInt16: 2,
    UInt24: 3,
    UInt32: 4,
    Int8: 1,
    Int16: 2,
    Int32: 4,
  };
}
