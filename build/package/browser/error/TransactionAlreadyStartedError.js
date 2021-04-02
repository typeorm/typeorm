import { __extends } from "tslib";
/**
 * Thrown when transaction is already started and user tries to run it again.
 */
var TransactionAlreadyStartedError = /** @class */ (function (_super) {
    __extends(TransactionAlreadyStartedError, _super);
    function TransactionAlreadyStartedError() {
        var _this = _super.call(this) || this;
        _this.name = "TransactionAlreadyStartedError";
        Object.setPrototypeOf(_this, TransactionAlreadyStartedError.prototype);
        _this.message = "Transaction already started for the given connection, commit current transaction before starting a new one.";
        return _this;
    }
    return TransactionAlreadyStartedError;
}(Error));
export { TransactionAlreadyStartedError };

//# sourceMappingURL=TransactionAlreadyStartedError.js.map
