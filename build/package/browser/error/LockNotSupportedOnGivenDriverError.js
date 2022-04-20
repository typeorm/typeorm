import { __extends } from "tslib";
/**
 * Thrown when selected sql driver does not supports locking.
 */
var LockNotSupportedOnGivenDriverError = /** @class */ (function (_super) {
    __extends(LockNotSupportedOnGivenDriverError, _super);
    function LockNotSupportedOnGivenDriverError() {
        var _this = _super.call(this) || this;
        _this.name = "LockNotSupportedOnGivenDriverError";
        Object.setPrototypeOf(_this, LockNotSupportedOnGivenDriverError.prototype);
        _this.message = "Locking not supported on given driver.";
        return _this;
    }
    return LockNotSupportedOnGivenDriverError;
}(Error));
export { LockNotSupportedOnGivenDriverError };

//# sourceMappingURL=LockNotSupportedOnGivenDriverError.js.map
