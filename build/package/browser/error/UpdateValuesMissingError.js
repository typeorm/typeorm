import { __extends } from "tslib";
/**
 * Thrown when user tries to update using QueryBuilder but do not specify what to update.
 */
var UpdateValuesMissingError = /** @class */ (function (_super) {
    __extends(UpdateValuesMissingError, _super);
    function UpdateValuesMissingError() {
        var _this = _super.call(this) || this;
        _this.name = "UpdateValuesMissingError";
        Object.setPrototypeOf(_this, UpdateValuesMissingError.prototype);
        _this.message = "Cannot perform update query because update values are not defined. Call \"qb.set(...)\" method to specify updated values.";
        return _this;
    }
    return UpdateValuesMissingError;
}(Error));
export { UpdateValuesMissingError };

//# sourceMappingURL=UpdateValuesMissingError.js.map
