"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PessimisticLockTransactionRequiredError = void 0;
/**
 * Thrown when a transaction is required for the current operation, but there is none open.
 */
class PessimisticLockTransactionRequiredError extends Error {
    constructor() {
        super();
        this.name = "PessimisticLockTransactionRequiredError";
        Object.setPrototypeOf(this, PessimisticLockTransactionRequiredError.prototype);
        this.message = `An open transaction is required for pessimistic lock.`;
    }
}
exports.PessimisticLockTransactionRequiredError = PessimisticLockTransactionRequiredError;
//# sourceMappingURL=PessimisticLockTransactionRequiredError.js.map