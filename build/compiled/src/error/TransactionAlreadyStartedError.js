"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionAlreadyStartedError = void 0;
/**
 * Thrown when transaction is already started and user tries to run it again.
 */
class TransactionAlreadyStartedError extends Error {
    constructor() {
        super();
        this.name = "TransactionAlreadyStartedError";
        Object.setPrototypeOf(this, TransactionAlreadyStartedError.prototype);
        this.message = `Transaction already started for the given connection, commit current transaction before starting a new one.`;
    }
}
exports.TransactionAlreadyStartedError = TransactionAlreadyStartedError;
//# sourceMappingURL=TransactionAlreadyStartedError.js.map