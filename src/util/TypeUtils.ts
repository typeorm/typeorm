export type Mutable<T> = {
    -readonly [k in keyof T]: T[k];
};
