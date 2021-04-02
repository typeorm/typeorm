"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptimisticLockVersionMismatchError = void 0;
var tslib_1 = require("tslib");
/**
 * Thrown when a version check on an object that uses optimistic locking through a version field fails.
 */
var OptimisticLockVersionMismatchError = /** @class */ (function (_super) {
    tslib_1.__extends(OptimisticLockVersionMismatchError, _super);
    function OptimisticLockVersionMismatchError(entity, expectedVersion, actualVersion) {
        var _this = _super.call(this) || this;
        _this.name = "OptimisticLockVersionMismatchError";
        Object.setPrototypeOf(_this, OptimisticLockVersionMismatchError.prototype);
        _this.message = "The optimistic lock on entity " + entity + " failed, version " + expectedVersion + " was expected, but is actually " + actualVersion + ".";
        return _this;
    }
    return OptimisticLockVersionMismatchError;
}(Error));
exports.OptimisticLockVersionMismatchError = OptimisticLockVersionMismatchError;

//# sourceMappingURL=OptimisticLockVersionMismatchError.js.map
