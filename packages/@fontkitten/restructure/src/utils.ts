import {Number as NumberT} from './Number';

type LengthSpecifier<P = any> =
  | number
  | string
  | NumberT
  | ((this: any, parent?: P) => number);

export function resolveLength(
  length: LengthSpecifier,
  stream?: { decode?: (s: any) => number } | any,
  parent?: any
): number {
  let res;
  if (typeof length === 'number') {
    res = length;

  } else if (typeof length === 'function') {
    res = length.call(parent, parent);

  } else if (parent && (typeof length === 'string')) {
    res = parent[length];

  } else if (stream && length instanceof NumberT) {
    res = length.decode(stream);
  }

  if (isNaN(res)) {
    throw new Error('Not a fixed size');
  }

  return res;
};

export class PropertyDescriptor implements globalThis.PropertyDescriptor {
  enumerable = true;
  configurable = true;
  
  constructor(opts: Partial<globalThis.PropertyDescriptor> = {}) {
    for (const key in opts) {
      (this as any)[key] = opts[key as keyof typeof opts];
    }
  }
}
