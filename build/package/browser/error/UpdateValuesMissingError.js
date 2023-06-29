/**
 * Thrown when user tries to update using QueryBuilder but do not specify what to update.
 */
export class UpdateValuesMissingError extends Error {
    constructor() {
        super();
        this.name = "UpdateValuesMissingError";
        Object.setPrototypeOf(this, UpdateValuesMissingError.prototype);
        this.message = `Cannot perform update query because update values are not defined. Call "qb.set(...)" method to specify updated values.`;
    }
}

//# sourceMappingURL=UpdateValuesMissingError.js.map
