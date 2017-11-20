/**
 * Thrown when user tries to build a query with RETURNING / OUTPUT statement,
 * but used database does not support it.
 */
export class ReturningStatementNotSupportedError extends Error {
    name = "ReturningStatementNotSupportedError";

    constructor() {
        super();
        this.message = `OUTPUT or RETURNING clause only supported by Microsoft SQL Server or PostgreSQL databases.`;
        this.stack = new Error().stack;
    }

}