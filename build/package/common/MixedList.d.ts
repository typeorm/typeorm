/**
 * List of T-s passed as an array or object map.
 *
 * Example usage: entities as an array of imported using import * as syntax.
 */
export declare type MixedList<T> = T[] | {
    [key: string]: T;
};
