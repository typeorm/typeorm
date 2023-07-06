"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionNotStartedError = void 0;
/**
 * Thrown when transaction is not started yet and user tries to run commit or rollback.
 */
class TransactionNotStartedError extends Error {
    constructor() {
        super();
        this.name = "TransactionNotStartedError";
        Object.setPrototypeOf(this, TransactionNotStartedError.prototype);
        this.message = `Transaction is not started yet, start transaction before committing or rolling it back.`;
    }
}
exports.TransactionNotStartedError = TransactionNotStartedError;
//# sourceMappingURL=TransactionNotStartedError.js.map