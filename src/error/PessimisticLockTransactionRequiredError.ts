/**
 * Thrown when a transaction is required for the current operation, but there is none open.
 */
export class PessimisticLockTransactionRequiredError extends Error {
    name = "PessimisticLockTransactionRequiredError";

    constructor() {
        super();
        Object.setPrototypeOf(this, PessimisticLockTransactionRequiredError.prototype);
        this.message = `An open transaction is required for pessimistic lock.`;
    }

}