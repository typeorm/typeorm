"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomRepositoryDoesNotHaveEntityError = void 0;
var tslib_1 = require("tslib");
/**
 * Thrown if custom repositories that extend AbstractRepository classes does not have managed entity.
 */
var CustomRepositoryDoesNotHaveEntityError = /** @class */ (function (_super) {
    tslib_1.__extends(CustomRepositoryDoesNotHaveEntityError, _super);
    function CustomRepositoryDoesNotHaveEntityError(repository) {
        var _this = _super.call(this) || this;
        _this.name = "CustomRepositoryDoesNotHaveEntityError";
        Object.setPrototypeOf(_this, CustomRepositoryDoesNotHaveEntityError.prototype);
        _this.message = "Custom repository " + (repository instanceof Function ? repository.name : repository.constructor.name) + " does not have managed entity. " +
            "Did you forget to specify entity for it @EntityRepository(MyEntity)? ";
        return _this;
    }
    return CustomRepositoryDoesNotHaveEntityError;
}(Error));
exports.CustomRepositoryDoesNotHaveEntityError = CustomRepositoryDoesNotHaveEntityError;

//# sourceMappingURL=CustomRepositoryDoesNotHaveEntityError.js.map
