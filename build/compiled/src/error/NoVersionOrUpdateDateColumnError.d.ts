/**
 * Thrown when an entity does not have no version and no update date column.
 */
export declare class NoVersionOrUpdateDateColumnError extends Error {
    name: string;
    constructor(entity: string);
}
