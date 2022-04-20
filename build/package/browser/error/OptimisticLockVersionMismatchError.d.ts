/**
 * Thrown when a version check on an object that uses optimistic locking through a version field fails.
 */
export declare class OptimisticLockVersionMismatchError extends Error {
    name: string;
    constructor(entity: string, expectedVersion: number | Date, actualVersion: number | Date);
}
