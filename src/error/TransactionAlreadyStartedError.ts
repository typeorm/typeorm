/**
 * Thrown when transaction is already started and user tries to run it again.
 */
export class TransactionAlreadyStartedError extends Error {
    name = "TransactionAlreadyStartedError";

    constructor() {
        super();
        Object.setPrototypeOf(this, TransactionAlreadyStartedError.prototype);
        this.message = `Transaction already started for the given connection, commit current transaction before starting a new one.`;
    }

}