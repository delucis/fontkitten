import {DecodeStream} from './DecodeStream.js';
import {EncodeStream} from './EncodeStream.js';

// Generic interface for a restructure type.
export interface ResType<T = unknown, P = any> {
  decode(stream: DecodeStream, parent?: P, length?: number): T;
  size(value?: T | null, parent?: any, includePointers?: boolean): number;
  // encode(stream: EncodeStream, value: T, parent?: any): void;
}

// Base class providing convenience helpers; concrete types implement decode/size/encode.
export abstract class Base<T = unknown, P = any> implements ResType<T, P> {
  // Optional hooks supported by many types.
  process?: (this: any, stream: DecodeStream) => void;
  preEncode?: (this: any, stream?: EncodeStream) => void;

  abstract decode(stream: DecodeStream, parent?: P, length?: number): T;
  // For fixed-size types, value and parent can be ignored
  abstract size(value?: T | null, parent?: any, includePointers?: boolean): number;
  // abstract encode(stream: EncodeStream, value: T, parent?: any): void;

  fromBuffer(buffer: Uint8Array): T {
    const stream = new DecodeStream(buffer);
    return this.decode(stream);
  }

  // toBuffer(value: T): Uint8Array {
  //   const size = this.size(value, undefined, true);
  //   const buffer = new Uint8Array(size);
  //   const stream = new EncodeStream(buffer);
  //   this.encode(stream, value);
  //   return buffer;
  // }
}
