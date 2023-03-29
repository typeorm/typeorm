"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomRepositoryNotFoundError = void 0;
var tslib_1 = require("tslib");
/**
 * Thrown if custom repository was not found.
 */
var CustomRepositoryNotFoundError = /** @class */ (function (_super) {
    tslib_1.__extends(CustomRepositoryNotFoundError, _super);
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
exports.CustomRepositoryNotFoundError = CustomRepositoryNotFoundError;

//# sourceMappingURL=CustomRepositoryNotFoundError.js.map
