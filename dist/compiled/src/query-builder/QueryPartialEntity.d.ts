/**
 * Make all properties in T optional
 */
export declare type QueryPartialEntity<T> = {
    [P in keyof T]?: T[P] | (() => string);
};
/**
 * Make all properties in T optional. Deep version.
 */
export declare type QueryDeepPartialEntity<T> = {
    [P in keyof T]?: T[P] extends Array<infer U> ? Array<QueryDeepPartialEntity<U>> : T[P] extends ReadonlyArray<infer U> ? ReadonlyArray<QueryDeepPartialEntity<U>> : QueryDeepPartialEntity<T[P]> | (() => string);
};
