import { __extends } from "tslib";
/**
 * Thrown when user tries to execute operation that requires connection to be established.
 */
var ConnectionIsNotSetError = /** @class */ (function (_super) {
    __extends(ConnectionIsNotSetError, _super);
    function ConnectionIsNotSetError(dbType) {
        var _this = _super.call(this) || this;
        _this.name = "ConnectionIsNotSetError";
        Object.setPrototypeOf(_this, ConnectionIsNotSetError.prototype);
        _this.message = "Connection with " + dbType + " database is not established. Check connection configuration.";
        return _this;
    }
    return ConnectionIsNotSetError;
}(Error));
export { ConnectionIsNotSetError };

//# sourceMappingURL=ConnectionIsNotSetError.js.map
