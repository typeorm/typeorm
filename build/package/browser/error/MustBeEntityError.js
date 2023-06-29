/**
 * Thrown when method expects entity but instead something else is given.
 */
export class MustBeEntityError extends Error {
    constructor(operation, wrongValue) {
        super();
        this.name = "MustBeEntityError";
        Object.setPrototypeOf(this, MustBeEntityError.prototype);
        this.message = `Cannot ${operation}, given value must be an entity, instead "${wrongValue}" is given.`;
    }
}

//# sourceMappingURL=MustBeEntityError.js.map
