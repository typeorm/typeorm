"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateValuesMissingError = void 0;
var tslib_1 = require("tslib");
/**
 * Thrown when user tries to update using QueryBuilder but do not specify what to update.
 */
var UpdateValuesMissingError = /** @class */ (function (_super) {
    tslib_1.__extends(UpdateValuesMissingError, _super);
    function UpdateValuesMissingError() {
        var _this = _super.call(this) || this;
        _this.name = "UpdateValuesMissingError";
        Object.setPrototypeOf(_this, UpdateValuesMissingError.prototype);
        _this.message = "Cannot perform update query because update values are not defined. Call \"qb.set(...)\" method to specify updated values.";
        return _this;
    }
    return UpdateValuesMissingError;
}(Error));
exports.UpdateValuesMissingError = UpdateValuesMissingError;

//# sourceMappingURL=UpdateValuesMissingError.js.map
