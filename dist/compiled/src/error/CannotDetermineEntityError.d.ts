/**
 * Thrown when user tries to save/remove/etc. constructor-less object (object literal) instead of entity.
 */
export declare class CannotDetermineEntityError extends Error {
    name: string;
    constructor(operation: string);
}
