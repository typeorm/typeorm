/**
 * Thrown when ORM cannot get column's type automatically.
 * Basically, when reflect-metadata is not available or tsconfig is not properly setup.
 */
export declare class ColumnTypeUndefinedError extends Error {
    name: string;
    constructor(object: Object, propertyName: string);
}
