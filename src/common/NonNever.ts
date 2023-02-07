/**
 * Remove keys with `never` value from object type
 * */
export type NonNever<T extends {}> = Pick<
    T,
    { [K in keyof T]: T[K] extends never ? never : K }[keyof T]
>
