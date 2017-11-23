/**
 * Thrown when method expects entity but instead something else is given.
 */
export class MustBeEntityError extends Error {
    name = "MustBeEntityError";

    constructor(operation: string, wrongValue: any) {
        super();
        this.message = `Cannot ${operation}, given value must be an entity, instead "${wrongValue}" is given.`;
        this.stack = new Error().stack;
    }

}