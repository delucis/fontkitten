import type { DecodeStream } from './DecodeStream';

/** Generic interface for a restructure type. */
export interface Structure<T = unknown, P = any> {
	decode(stream: DecodeStream, parent?: P, length?: number): T;
}

/** Generic interface for a restructure type that can provide size information. */
export interface SizedStructure<T = unknown, P = any> extends Structure<T, P> {
	/** For fixed-size types, value and parent can be ignored */
	size(value?: T | null, parent?: any, includePointers?: boolean): number;
}
