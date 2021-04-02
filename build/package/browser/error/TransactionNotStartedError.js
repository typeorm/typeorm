import { __extends } from "tslib";
/**
 * Thrown when transaction is not started yet and user tries to run commit or rollback.
 */
var TransactionNotStartedError = /** @class */ (function (_super) {
    __extends(TransactionNotStartedError, _super);
    function TransactionNotStartedError() {
        var _this = _super.call(this) || this;
        _this.name = "TransactionNotStartedError";
        Object.setPrototypeOf(_this, TransactionNotStartedError.prototype);
        _this.message = "Transaction is not started yet, start transaction before committing or rolling it back.";
        return _this;
    }
    return TransactionNotStartedError;
}(Error));
export { TransactionNotStartedError };

//# sourceMappingURL=TransactionNotStartedError.js.map
