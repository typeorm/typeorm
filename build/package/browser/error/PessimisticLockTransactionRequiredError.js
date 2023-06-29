/**
 * Thrown when a transaction is required for the current operation, but there is none open.
 */
export class PessimisticLockTransactionRequiredError extends Error {
    constructor() {
        super();
        this.name = "PessimisticLockTransactionRequiredError";
        Object.setPrototypeOf(this, PessimisticLockTransactionRequiredError.prototype);
        this.message = `An open transaction is required for pessimistic lock.`;
    }
}

//# sourceMappingURL=PessimisticLockTransactionRequiredError.js.map
