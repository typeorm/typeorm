"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CannotExecuteNotConnectedError = void 0;
var tslib_1 = require("tslib");
/**
 * Thrown when consumer tries to execute operation allowed only if connection is opened.
 */
var CannotExecuteNotConnectedError = /** @class */ (function (_super) {
    tslib_1.__extends(CannotExecuteNotConnectedError, _super);
    function CannotExecuteNotConnectedError(connectionName) {
        var _this = _super.call(this) || this;
        _this.name = "CannotExecuteNotConnectedError";
        Object.setPrototypeOf(_this, CannotExecuteNotConnectedError.prototype);
        _this.message = "Cannot execute operation on \"" + connectionName + "\" connection because connection is not yet established.";
        return _this;
    }
    return CannotExecuteNotConnectedError;
}(Error));
exports.CannotExecuteNotConnectedError = CannotExecuteNotConnectedError;

//# sourceMappingURL=CannotExecuteNotConnectedError.js.map
