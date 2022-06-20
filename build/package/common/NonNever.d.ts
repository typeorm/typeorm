/**
 * Remove keys with `never` value from object type
 * */
export declare type NonNever<T extends {}> = Pick<T, {
    [K in keyof T]: T[K] extends never ? never : K;
}[keyof T]>;
