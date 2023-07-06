"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CannotDetermineEntityError = void 0;
/**
 * Thrown when user tries to save/remove/etc. constructor-less object (object literal) instead of entity.
 */
class CannotDetermineEntityError extends Error {
    constructor(operation) {
        super();
        this.name = "CannotDetermineEntityError";
        Object.setPrototypeOf(this, CannotDetermineEntityError.prototype);
        this.message = `Cannot ${operation}, given value must be instance of entity class, instead object literal is given. Or you must specify an entity target to method call.`;
    }
}
exports.CannotDetermineEntityError = CannotDetermineEntityError;
//# sourceMappingURL=CannotDetermineEntityError.js.map