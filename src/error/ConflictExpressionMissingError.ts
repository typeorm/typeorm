/**
 * Thrown when user tries to upsert using InsertQueryBuilder but does not provide a conflict expression.
 */
export class ConflictExpressionMissingError extends Error {
    name = "ConflictExpressionMissingError";

    constructor() {
        super();
        Object.setPrototypeOf(this, ConflictExpressionMissingError.prototype);
        this.message = `Cannot perform INSERT ON CONFLICT query because conflict expression is not defined. Call "qb.onConflict(...)" method to specify expression or columns.`;
    }

}
