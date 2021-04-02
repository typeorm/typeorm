"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoNeedToReleaseEntityManagerError = void 0;
var tslib_1 = require("tslib");
/**
 * Thrown when consumer tries to release entity manager that does not use single database connection.
 */
var NoNeedToReleaseEntityManagerError = /** @class */ (function (_super) {
    tslib_1.__extends(NoNeedToReleaseEntityManagerError, _super);
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
exports.NoNeedToReleaseEntityManagerError = NoNeedToReleaseEntityManagerError;

//# sourceMappingURL=NoNeedToReleaseEntityManagerError.js.map
