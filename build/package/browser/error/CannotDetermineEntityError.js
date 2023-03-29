import { __extends } from "tslib";
/**
 * Thrown when user tries to save/remove/etc. constructor-less object (object literal) instead of entity.
 */
var CannotDetermineEntityError = /** @class */ (function (_super) {
    __extends(CannotDetermineEntityError, _super);
    function CannotDetermineEntityError(operation) {
        var _this = _super.call(this) || this;
        _this.name = "CannotDetermineEntityError";
        Object.setPrototypeOf(_this, CannotDetermineEntityError.prototype);
        _this.message = "Cannot " + operation + ", given value must be instance of entity class, instead object literal is given. Or you must specify an entity target to method call.";
        return _this;
    }
    return CannotDetermineEntityError;
}(Error));
export { CannotDetermineEntityError };

//# sourceMappingURL=CannotDetermineEntityError.js.map
