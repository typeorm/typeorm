/**
 * Thrown when user tries to save/remove/etc. constructor-less object (object literal) instead of entity.
 */
export class CannotDetermineEntityError extends Error {
    name = "CannotDetermineEntityError";

    constructor(operation: string) {
        super();
        Object.setPrototypeOf(this, CannotDetermineEntityError.prototype);
        this.message = `Cannot ${operation}, given value must be instance of entity class, instead object literal is given. Or you must specify an entity target to method call.`;
    }

}