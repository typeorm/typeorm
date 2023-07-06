"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReturningStatementNotSupportedError = void 0;
/**
 * Thrown when user tries to build a query with RETURNING / OUTPUT statement,
 * but used database does not support it.
 */
class ReturningStatementNotSupportedError extends Error {
    constructor() {
        super();
        this.name = "ReturningStatementNotSupportedError";
        Object.setPrototypeOf(this, ReturningStatementNotSupportedError.prototype);
        this.message = `OUTPUT or RETURNING clause only supported by Microsoft SQL Server or PostgreSQL databases.`;
    }
}
exports.ReturningStatementNotSupportedError = ReturningStatementNotSupportedError;
//# sourceMappingURL=ReturningStatementNotSupportedError.js.map