import { __extends } from "tslib";
/**
 * Thrown when a version check on an object that uses optimistic locking through a version field fails.
 */
var OptimisticLockVersionMismatchError = /** @class */ (function (_super) {
    __extends(OptimisticLockVersionMismatchError, _super);
    function OptimisticLockVersionMismatchError(entity, expectedVersion, actualVersion) {
        var _this = _super.call(this) || this;
        _this.name = "OptimisticLockVersionMismatchError";
        Object.setPrototypeOf(_this, OptimisticLockVersionMismatchError.prototype);
        _this.message = "The optimistic lock on entity " + entity + " failed, version " + expectedVersion + " was expected, but is actually " + actualVersion + ".";
        return _this;
    }
    return OptimisticLockVersionMismatchError;
}(Error));
export { OptimisticLockVersionMismatchError };

//# sourceMappingURL=OptimisticLockVersionMismatchError.js.map
