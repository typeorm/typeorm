"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectionNotFoundError = void 0;
var tslib_1 = require("tslib");
/**
 * Thrown when consumer tries to get connection that does not exist.
 */
var ConnectionNotFoundError = /** @class */ (function (_super) {
    tslib_1.__extends(ConnectionNotFoundError, _super);
    function ConnectionNotFoundError(name) {
        var _this = _super.call(this) || this;
        _this.name = "ConnectionNotFoundError";
        Object.setPrototypeOf(_this, ConnectionNotFoundError.prototype);
        _this.message = "Connection \"" + name + "\" was not found.";
        return _this;
    }
    return ConnectionNotFoundError;
}(Error));
exports.ConnectionNotFoundError = ConnectionNotFoundError;

//# sourceMappingURL=ConnectionNotFoundError.js.map
