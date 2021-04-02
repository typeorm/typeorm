import { __extends } from "tslib";
/**
 * Thrown if custom repository was not found.
 */
var CustomRepositoryNotFoundError = /** @class */ (function (_super) {
    __extends(CustomRepositoryNotFoundError, _super);
    function CustomRepositoryNotFoundError(repository) {
        var _this = _super.call(this) || this;
        _this.name = "CustomRepositoryNotFoundError";
        Object.setPrototypeOf(_this, CustomRepositoryNotFoundError.prototype);
        _this.message = "Custom repository " + (repository instanceof Function ? repository.name : repository.constructor.name) + " was not found. " +
            "Did you forgot to put @EntityRepository decorator on it?";
        return _this;
    }
    return CustomRepositoryNotFoundError;
}(Error));
export { CustomRepositoryNotFoundError };

//# sourceMappingURL=CustomRepositoryNotFoundError.js.map
