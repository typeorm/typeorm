"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CannotConnectAlreadyConnectedError = void 0;
var tslib_1 = require("tslib");
/**
 * Thrown when consumer tries to connect when he already connected.
 */
var CannotConnectAlreadyConnectedError = /** @class */ (function (_super) {
    tslib_1.__extends(CannotConnectAlreadyConnectedError, _super);
    function CannotConnectAlreadyConnectedError(connectionName) {
        var _this = _super.call(this) || this;
        _this.name = "CannotConnectAlreadyConnectedError";
        Object.setPrototypeOf(_this, CannotConnectAlreadyConnectedError.prototype);
        _this.message = "Cannot create a \"" + connectionName + "\" connection because connection to the database already established.";
        return _this;
    }
    return CannotConnectAlreadyConnectedError;
}(Error));
exports.CannotConnectAlreadyConnectedError = CannotConnectAlreadyConnectedError;

//# sourceMappingURL=CannotConnectAlreadyConnectedError.js.map
