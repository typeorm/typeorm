export type MaxPropertyPathRecursionDepth = 5;

export type PropertyPath<T> = PropertyPathInner<T, keyof T, MaxPropertyPathRecursionDepth, []>;

type PropertyPathInner<
    T,
    Key,
    MaxDepth extends number,
    AccumulatedDepth extends unknown[]
    > = Key extends keyof T & string ?
    Exclude<T[Key], null | undefined> extends Function ? never : Exclude<T[Key], null | undefined> extends string | symbol | number | Date ? Key : Key |
    (AccumulatedDepth["length"] extends MaxDepth ? never : `${Key}.${PropertyPathInner<
        Exclude<T[Key], null | undefined>,
        keyof (Exclude<T[Key], null | undefined>),
        MaxDepth,
        [unknown, ...AccumulatedDepth]
    >}`) : never;

export type MaxRelationPathRecursionDepth = 5;

export type RelationPath<T> = RelationPathInner<T, keyof T, MaxRelationPathRecursionDepth, []>;

type RelationPathInner<
    T,
    Key,
    MaxDepth extends number,
    AccumulatedDepth extends unknown[]
    > = Key extends keyof T & string ?
    Exclude<T[Key], null | undefined> extends Function ? never : Exclude<T[Key], null | undefined> extends string | symbol | number | Date ? Key : Key |
    (AccumulatedDepth["length"] extends MaxDepth ? never : `${Key}.${RelationPathInner<
        Exclude<T[Key], null | undefined> extends (infer R)[] ? R : T[Key],
        keyof (Exclude<T[Key], null | undefined> extends (infer R)[] ? R : T[Key]),
        MaxDepth,
        [unknown, ...AccumulatedDepth]
    >}`) : never;
