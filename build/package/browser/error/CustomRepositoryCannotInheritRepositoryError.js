import { __extends } from "tslib";
/**
 * Thrown if custom repository inherits Repository class however entity is not set in @EntityRepository decorator.
 */
var CustomRepositoryCannotInheritRepositoryError = /** @class */ (function (_super) {
    __extends(CustomRepositoryCannotInheritRepositoryError, _super);
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
export { CustomRepositoryCannotInheritRepositoryError };

//# sourceMappingURL=CustomRepositoryCannotInheritRepositoryError.js.map
