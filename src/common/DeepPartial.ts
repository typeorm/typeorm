/**
 * Same as Partial<T> but goes deeper and makes Partial<T> all its properties and sub-properties.
 */
export type DeepPartial<T> =
    T extends Array<infer U> ? DeepPartialArray<U> :
    T extends Map<infer K, infer V> ? DeepPartialMap<K, V> :
    T extends Set<infer M> ? DeepPartialSet<M> :
    T extends object ? DeepPartialObject<T> :
    T;

export type DeepPartialArray<T> = Array<DeepPartial<T>>;
export type DeepPartialMap<K, V> = Map<DeepPartial<K>, DeepPartial<V>>;
export type DeepPartialSet<T> = Set<DeepPartial<T>>;
export type DeepPartialObject<T> = { [K in keyof T]?: DeepPartial<T[K]> };
