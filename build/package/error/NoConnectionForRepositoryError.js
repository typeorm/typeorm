"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoConnectionForRepositoryError = void 0;
var tslib_1 = require("tslib");
/**
 * Thrown when consumer tries to access repository before connection is established.
 */
var NoConnectionForRepositoryError = /** @class */ (function (_super) {
    tslib_1.__extends(NoConnectionForRepositoryError, _super);
    function NoConnectionForRepositoryError(connectionName) {
        var _this = _super.call(this) || this;
        _this.name = "NoConnectionForRepositoryError";
        Object.setPrototypeOf(_this, NoConnectionForRepositoryError.prototype);
        _this.message = "Cannot get a Repository for \"" + connectionName + " connection, because connection with the database " +
            "is not established yet. Call connection#connect method to establish connection.";
        return _this;
    }
    return NoConnectionForRepositoryError;
}(Error));
exports.NoConnectionForRepositoryError = NoConnectionForRepositoryError;

//# sourceMappingURL=NoConnectionForRepositoryError.js.map
