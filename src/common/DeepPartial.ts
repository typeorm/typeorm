/**
 * Same as Partial<T> but goes deeper and makes Partial<T> all its properties and sub-properties.
 */
export type DeepPartial<T> = {
    [P in keyof T]?: DeepPartial<T[P]>;
};
