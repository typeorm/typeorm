import { __extends } from "tslib";
/**
 * Thrown when consumer tries to connect when he already connected.
 */
var CannotConnectAlreadyConnectedError = /** @class */ (function (_super) {
    __extends(CannotConnectAlreadyConnectedError, _super);
    function CannotConnectAlreadyConnectedError(connectionName) {
        var _this = _super.call(this) || this;
        _this.name = "CannotConnectAlreadyConnectedError";
        Object.setPrototypeOf(_this, CannotConnectAlreadyConnectedError.prototype);
        _this.message = "Cannot create a \"" + connectionName + "\" connection because connection to the database already established.";
        return _this;
    }
    return CannotConnectAlreadyConnectedError;
}(Error));
export { CannotConnectAlreadyConnectedError };

//# sourceMappingURL=CannotConnectAlreadyConnectedError.js.map
