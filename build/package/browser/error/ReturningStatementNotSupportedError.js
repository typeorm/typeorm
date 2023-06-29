/**
 * Thrown when user tries to build a query with RETURNING / OUTPUT statement,
 * but used database does not support it.
 */
export class ReturningStatementNotSupportedError extends Error {
    constructor() {
        super();
        this.name = "ReturningStatementNotSupportedError";
        Object.setPrototypeOf(this, ReturningStatementNotSupportedError.prototype);
        this.message = `OUTPUT or RETURNING clause only supported by Microsoft SQL Server or PostgreSQL databases.`;
    }
}

//# sourceMappingURL=ReturningStatementNotSupportedError.js.map
