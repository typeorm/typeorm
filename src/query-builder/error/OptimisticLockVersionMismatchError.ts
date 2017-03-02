/**
 * Thrown when a version check on an object that uses optimistic locking through a version field fails.
 */
export class OptimisticLockVersionMismatchError extends Error {
    name = "OptimisticLockVersionMismatchError";

    constructor(entity: string, expectedVersion: number|Date, actualVersion: number|Date) {
        super();
        Object.setPrototypeOf(this, OptimisticLockVersionMismatchError.prototype);
        this.message = `The optimistic lock on entity ${entity} failed, version ${expectedVersion} was expected, but is actually ${actualVersion}.`;
    }

}
