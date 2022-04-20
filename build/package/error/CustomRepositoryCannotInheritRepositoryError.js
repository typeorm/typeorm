"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomRepositoryCannotInheritRepositoryError = void 0;
var tslib_1 = require("tslib");
/**
 * Thrown if custom repository inherits Repository class however entity is not set in @EntityRepository decorator.
 */
var CustomRepositoryCannotInheritRepositoryError = /** @class */ (function (_super) {
    tslib_1.__extends(CustomRepositoryCannotInheritRepositoryError, _super);
    function CustomRepositoryCannotInheritRepositoryError(repository) {
        var _this = _super.call(this) || this;
        _this.name = "CustomRepositoryCannotInheritRepositoryError";
        Object.setPrototypeOf(_this, CustomRepositoryCannotInheritRepositoryError.prototype);
        _this.message = "Custom entity repository " + (repository instanceof Function ? repository.name : repository.constructor.name) + " " +
            " cannot inherit Repository class without entity being set in the @EntityRepository decorator.";
        return _this;
    }
    return CustomRepositoryCannotInheritRepositoryError;
}(Error));
exports.CustomRepositoryCannotInheritRepositoryError = CustomRepositoryCannotInheritRepositoryError;

//# sourceMappingURL=CustomRepositoryCannotInheritRepositoryError.js.map
