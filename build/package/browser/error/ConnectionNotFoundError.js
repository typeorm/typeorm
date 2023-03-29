import { __extends } from "tslib";
/**
 * Thrown when consumer tries to get connection that does not exist.
 */
var ConnectionNotFoundError = /** @class */ (function (_super) {
    __extends(ConnectionNotFoundError, _super);
    function ConnectionNotFoundError(name) {
        var _this = _super.call(this) || this;
        _this.name = "ConnectionNotFoundError";
        Object.setPrototypeOf(_this, ConnectionNotFoundError.prototype);
        _this.message = "Connection \"" + name + "\" was not found.";
        return _this;
    }
    return ConnectionNotFoundError;
}(Error));
export { ConnectionNotFoundError };

//# sourceMappingURL=ConnectionNotFoundError.js.map
