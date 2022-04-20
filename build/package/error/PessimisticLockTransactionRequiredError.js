"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PessimisticLockTransactionRequiredError = void 0;
var tslib_1 = require("tslib");
/**
 * Thrown when a transaction is required for the current operation, but there is none open.
 */
var PessimisticLockTransactionRequiredError = /** @class */ (function (_super) {
    tslib_1.__extends(PessimisticLockTransactionRequiredError, _super);
    function PessimisticLockTransactionRequiredError() {
        var _this = _super.call(this) || this;
        _this.name = "PessimisticLockTransactionRequiredError";
        Object.setPrototypeOf(_this, PessimisticLockTransactionRequiredError.prototype);
        _this.message = "An open transaction is required for pessimistic lock.";
        return _this;
    }
    return PessimisticLockTransactionRequiredError;
}(Error));
exports.PessimisticLockTransactionRequiredError = PessimisticLockTransactionRequiredError;

//# sourceMappingURL=PessimisticLockTransactionRequiredError.js.map
