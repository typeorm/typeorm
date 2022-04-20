"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReturningStatementNotSupportedError = void 0;
var tslib_1 = require("tslib");
/**
 * Thrown when user tries to build a query with RETURNING / OUTPUT statement,
 * but used database does not support it.
 */
var ReturningStatementNotSupportedError = /** @class */ (function (_super) {
    tslib_1.__extends(ReturningStatementNotSupportedError, _super);
    function ReturningStatementNotSupportedError() {
        var _this = _super.call(this) || this;
        _this.name = "ReturningStatementNotSupportedError";
        Object.setPrototypeOf(_this, ReturningStatementNotSupportedError.prototype);
        _this.message = "OUTPUT or RETURNING clause only supported by Microsoft SQL Server or PostgreSQL databases.";
        return _this;
    }
    return ReturningStatementNotSupportedError;
}(Error));
exports.ReturningStatementNotSupportedError = ReturningStatementNotSupportedError;

//# sourceMappingURL=ReturningStatementNotSupportedError.js.map
