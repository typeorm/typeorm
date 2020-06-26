/**
 * Thrown when an optimistic lock cannot be used in query builder.
 */
export class OptimisticLockCanNotBeUsedError extends Error {
    name = "OptimisticLockCanNotBeUsedError";

    constructor() {
        super();
        Object.setPrototypeOf(this, OptimisticLockCanNotBeUsedError.prototype);
        this.message = `The optimistic lock can be used only with getOne() method.`;
    }

}
