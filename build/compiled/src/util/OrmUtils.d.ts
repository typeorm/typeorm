import { ObjectLiteral } from "../common/ObjectLiteral";
export declare class OrmUtils {
    /**
     * Chunks array into peaces.
     */
    static chunk<T>(array: T[], size: number): T[][];
    static splitClassesAndStrings<T>(clsesAndStrings: (string | T)[]): [T[], string[]];
    static groupBy<T, R>(array: T[], propertyCallback: (item: T) => R): {
        id: R;
        items: T[];
    }[];
    static uniq<T>(array: T[], criteria?: (item: T) => any): T[];
    static uniq<T, K extends keyof T>(array: T[], property: K): T[];
    static isObject(item: any): any;
    /**
     * Deep Object.assign.
     *
     * @see http://stackoverflow.com/a/34749873
     */
    static mergeDeep(target: any, ...sources: any[]): any;
    /**
     * Deep compare objects.
     *
     * @see http://stackoverflow.com/a/1144249
     */
    static deepCompare(...args: any[]): boolean;
    /**
     * Check if two entity-id-maps are the same
     */
    static compareIds(firstId: ObjectLiteral | undefined, secondId: ObjectLiteral | undefined): boolean;
    /**
     * Transforms given value into boolean value.
     */
    static toBoolean(value: any): boolean;
    /**
     * Composes an object from the given array of keys and values.
     */
    static zipObject(keys: any[], values: any[]): ObjectLiteral;
    /**
     * Compares two arrays.
     */
    static isArraysEqual(arr1: any[], arr2: any[]): boolean;
    private static compare2Objects;
}
