"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectionIsNotSetError = void 0;
var tslib_1 = require("tslib");
/**
 * Thrown when user tries to execute operation that requires connection to be established.
 */
var ConnectionIsNotSetError = /** @class */ (function (_super) {
    tslib_1.__extends(ConnectionIsNotSetError, _super);
    function ConnectionIsNotSetError(dbType) {
        var _this = _super.call(this) || this;
        _this.name = "ConnectionIsNotSetError";
        Object.setPrototypeOf(_this, ConnectionIsNotSetError.prototype);
        _this.message = "Connection with " + dbType + " database is not established. Check connection configuration.";
        return _this;
    }
    return ConnectionIsNotSetError;
}(Error));
exports.ConnectionIsNotSetError = ConnectionIsNotSetError;

//# sourceMappingURL=ConnectionIsNotSetError.js.map
