import { __extends } from "tslib";
/**
 * Thrown when an optimistic lock cannot be used in query builder.
 */
var OptimisticLockCanNotBeUsedError = /** @class */ (function (_super) {
    __extends(OptimisticLockCanNotBeUsedError, _super);
    function OptimisticLockCanNotBeUsedError() {
        var _this = _super.call(this) || this;
        _this.name = "OptimisticLockCanNotBeUsedError";
        Object.setPrototypeOf(_this, OptimisticLockCanNotBeUsedError.prototype);
        _this.message = "The optimistic lock can be used only with getOne() method.";
        return _this;
    }
    return OptimisticLockCanNotBeUsedError;
}(Error));
export { OptimisticLockCanNotBeUsedError };

//# sourceMappingURL=OptimisticLockCanNotBeUsedError.js.map
