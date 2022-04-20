"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CannotGetEntityManagerNotConnectedError = void 0;
var tslib_1 = require("tslib");
/**
 * Thrown when consumer tries to access entity manager before connection is established.
 */
var CannotGetEntityManagerNotConnectedError = /** @class */ (function (_super) {
    tslib_1.__extends(CannotGetEntityManagerNotConnectedError, _super);
    function CannotGetEntityManagerNotConnectedError(connectionName) {
        var _this = _super.call(this) || this;
        _this.name = "CannotGetEntityManagerNotConnectedError";
        Object.setPrototypeOf(_this, CannotGetEntityManagerNotConnectedError.prototype);
        _this.message = "Cannot get entity manager for \"" + connectionName + "\" connection because connection is not yet established.";
        return _this;
    }
    return CannotGetEntityManagerNotConnectedError;
}(Error));
exports.CannotGetEntityManagerNotConnectedError = CannotGetEntityManagerNotConnectedError;

//# sourceMappingURL=CannotGetEntityManagerNotConnectedError.js.map
