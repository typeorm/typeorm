"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptimisticLockVersionMismatchError = void 0;
/**
 * Thrown when a version check on an object that uses optimistic locking through a version field fails.
 */
class OptimisticLockVersionMismatchError extends Error {
    constructor(entity, expectedVersion, actualVersion) {
        super();
        this.name = "OptimisticLockVersionMismatchError";
        Object.setPrototypeOf(this, OptimisticLockVersionMismatchError.prototype);
        this.message = `The optimistic lock on entity ${entity} failed, version ${expectedVersion} was expected, but is actually ${actualVersion}.`;
    }
}
exports.OptimisticLockVersionMismatchError = OptimisticLockVersionMismatchError;
//# sourceMappingURL=OptimisticLockVersionMismatchError.js.map