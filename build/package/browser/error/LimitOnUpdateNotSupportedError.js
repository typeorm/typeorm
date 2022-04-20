import { __extends } from "tslib";
/**
 * Thrown when user tries to build an UPDATE query with LIMIT but the database does not support it.
*/
var LimitOnUpdateNotSupportedError = /** @class */ (function (_super) {
    __extends(LimitOnUpdateNotSupportedError, _super);
    function LimitOnUpdateNotSupportedError() {
        var _this = _super.call(this) || this;
        _this.name = "LimitOnUpdateNotSupportedError";
        Object.setPrototypeOf(_this, LimitOnUpdateNotSupportedError.prototype);
        _this.message = "Your database does not support LIMIT on UPDATE statements.";
        return _this;
    }
    return LimitOnUpdateNotSupportedError;
}(Error));
export { LimitOnUpdateNotSupportedError };

//# sourceMappingURL=LimitOnUpdateNotSupportedError.js.map
