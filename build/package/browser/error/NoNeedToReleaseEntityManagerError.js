import { __extends } from "tslib";
/**
 * Thrown when consumer tries to release entity manager that does not use single database connection.
 */
var NoNeedToReleaseEntityManagerError = /** @class */ (function (_super) {
    __extends(NoNeedToReleaseEntityManagerError, _super);
    function NoNeedToReleaseEntityManagerError() {
        var _this = _super.call(this) || this;
        _this.name = "NoNeedToReleaseEntityManagerError";
        Object.setPrototypeOf(_this, NoNeedToReleaseEntityManagerError.prototype);
        _this.message = "Entity manager is not using single database connection and cannot be released. " +
            "Only entity managers created by connection#createEntityManagerWithSingleDatabaseConnection " +
            "methods have a single database connection and they should be released.";
        return _this;
    }
    return NoNeedToReleaseEntityManagerError;
}(Error));
export { NoNeedToReleaseEntityManagerError };

//# sourceMappingURL=NoNeedToReleaseEntityManagerError.js.map
