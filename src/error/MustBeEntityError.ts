/**
 * Thrown when method expects entity but instead something else is given.
 */
export class MustBeEntityError extends Error {
    name = "MustBeEntityError";

    constructor(operation: string, wrongValue: any) {
        super();
        Object.setPrototypeOf(this, MustBeEntityError.prototype);
        this.message = `Cannot ${operation}, given value must be an entity, instead "${wrongValue}" is given.`;
    }

}