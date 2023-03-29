"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CannotDetermineEntityError = void 0;
var tslib_1 = require("tslib");
/**
 * Thrown when user tries to save/remove/etc. constructor-less object (object literal) instead of entity.
 */
var CannotDetermineEntityError = /** @class */ (function (_super) {
    tslib_1.__extends(CannotDetermineEntityError, _super);
    function CannotDetermineEntityError(operation) {
        var _this = _super.call(this) || this;
        _this.name = "CannotDetermineEntityError";
        Object.setPrototypeOf(_this, CannotDetermineEntityError.prototype);
        _this.message = "Cannot " + operation + ", given value must be instance of entity class, instead object literal is given. Or you must specify an entity target to method call.";
        return _this;
    }
    return CannotDetermineEntityError;
}(Error));
exports.CannotDetermineEntityError = CannotDetermineEntityError;

//# sourceMappingURL=CannotDetermineEntityError.js.map
