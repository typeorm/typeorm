/**
 * Thrown when selected sql driver does not supports locking.
 */
export declare class LockNotSupportedOnGivenDriverError extends Error {
    name: string;
    constructor();
}
