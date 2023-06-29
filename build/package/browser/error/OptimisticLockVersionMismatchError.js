/**
 * Thrown when a version check on an object that uses optimistic locking through a version field fails.
 */
export class OptimisticLockVersionMismatchError extends Error {
    constructor(entity, expectedVersion, actualVersion) {
        super();
        this.name = "OptimisticLockVersionMismatchError";
        Object.setPrototypeOf(this, OptimisticLockVersionMismatchError.prototype);
        this.message = `The optimistic lock on entity ${entity} failed, version ${expectedVersion} was expected, but is actually ${actualVersion}.`;
    }
}

//# sourceMappingURL=OptimisticLockVersionMismatchError.js.map
