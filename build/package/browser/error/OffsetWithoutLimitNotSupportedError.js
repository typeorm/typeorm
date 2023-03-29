import { __extends } from "tslib";
/**
 * Thrown when user tries to build SELECT query using OFFSET without LIMIT applied but database does not support it.
*/
var OffsetWithoutLimitNotSupportedError = /** @class */ (function (_super) {
    __extends(OffsetWithoutLimitNotSupportedError, _super);
    function OffsetWithoutLimitNotSupportedError() {
        var _this = _super.call(this) || this;
        _this.name = "OffsetWithoutLimitNotSupportedError";
        Object.setPrototypeOf(_this, OffsetWithoutLimitNotSupportedError.prototype);
        _this.message = "RDBMS does not support OFFSET without LIMIT in SELECT statements. You must use limit in conjunction with offset function (or take in conjunction with skip function if you are using pagination).";
        return _this;
    }
    return OffsetWithoutLimitNotSupportedError;
}(Error));
export { OffsetWithoutLimitNotSupportedError };

//# sourceMappingURL=OffsetWithoutLimitNotSupportedError.js.map
