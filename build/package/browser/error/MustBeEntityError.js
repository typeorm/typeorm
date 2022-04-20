import { __extends } from "tslib";
/**
 * Thrown when method expects entity but instead something else is given.
 */
var MustBeEntityError = /** @class */ (function (_super) {
    __extends(MustBeEntityError, _super);
    function MustBeEntityError(operation, wrongValue) {
        var _this = _super.call(this) || this;
        _this.name = "MustBeEntityError";
        Object.setPrototypeOf(_this, MustBeEntityError.prototype);
        _this.message = "Cannot " + operation + ", given value must be an entity, instead \"" + wrongValue + "\" is given.";
        return _this;
    }
    return MustBeEntityError;
}(Error));
export { MustBeEntityError };

//# sourceMappingURL=MustBeEntityError.js.map
