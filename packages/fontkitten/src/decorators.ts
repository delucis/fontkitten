/**
 * This decorator caches the results of a getter or method such that
 * the results are lazily computed once, and then cached.
 */
export function cache<T extends any>(
  _target: any,
  key: string,
  descriptor: TypedPropertyDescriptor<T>
): TypedPropertyDescriptor<T> {
  if (descriptor.get) {
    const get = descriptor.get;
    descriptor.get = function() {
      const value = get.call(this);
      Object.defineProperty(this, key, { value });
      return value;
    };
  } else if (typeof descriptor.value === 'function') {
    const fn = descriptor.value;

    return {
      get() {
        const cache = new Map();
        const memoized = ((...args: any[]) => {
          const key = args.length > 0 ? args[0] : 'value';
          if (cache.has(key)) {
            return cache.get(key);
          }

          const result = fn.apply(this, args);
          cache.set(key, result);
          return result;
        }) as T;

        Object.defineProperty(this, key, {value: memoized});
        return memoized;
      }
    };
  }
  return descriptor;
}
