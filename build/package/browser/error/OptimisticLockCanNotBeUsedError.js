/**
 * Thrown when an optimistic lock cannot be used in query builder.
 */
export class OptimisticLockCanNotBeUsedError extends Error {
    constructor() {
        super();
        this.name = "OptimisticLockCanNotBeUsedError";
        Object.setPrototypeOf(this, OptimisticLockCanNotBeUsedError.prototype);
        this.message = `The optimistic lock can be used only with getOne() method.`;
    }
}

//# sourceMappingURL=OptimisticLockCanNotBeUsedError.js.map
