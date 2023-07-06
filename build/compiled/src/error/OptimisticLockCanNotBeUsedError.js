"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptimisticLockCanNotBeUsedError = void 0;
/**
 * Thrown when an optimistic lock cannot be used in query builder.
 */
class OptimisticLockCanNotBeUsedError extends Error {
    constructor() {
        super();
        this.name = "OptimisticLockCanNotBeUsedError";
        Object.setPrototypeOf(this, OptimisticLockCanNotBeUsedError.prototype);
        this.message = `The optimistic lock can be used only with getOne() method.`;
    }
}
exports.OptimisticLockCanNotBeUsedError = OptimisticLockCanNotBeUsedError;
//# sourceMappingURL=OptimisticLockCanNotBeUsedError.js.map