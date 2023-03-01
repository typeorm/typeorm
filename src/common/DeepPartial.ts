/**
 * Same as Partial<T> but goes deeper and makes Partial<T> all its properties and sub-properties.
 */
export type DeepPartial<T> =
    // If T is already a primitive type, return it as is.
    | T
    // If T is an array, apply DeepPartial to its element type and return an array of those.
    | (T extends Array<infer U>
          ? DeepPartial<U>[]
          // If T is a Map, apply DeepPartial to its key and value types and return a new Map.
          : T extends Map<infer K, infer V>
          ? Map<DeepPartial<K>, DeepPartial<V>>
          // If T is a Set, apply DeepPartial to its element type and return a new Set.
          : T extends Set<infer M>
          ? Set<DeepPartial<M>>
          // If T is an object, recursively apply DeepPartial to all of its properties.
          : T extends object
          ? { [K in keyof T]?: DeepPartial<T[K]> }
          // If T is anything else (e.g. a function), return it as is.
          : T)
