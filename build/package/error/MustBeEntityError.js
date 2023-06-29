"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MustBeEntityError = void 0;
/**
 * Thrown when method expects entity but instead something else is given.
 */
class MustBeEntityError extends Error {
    constructor(operation, wrongValue) {
        super();
        this.name = "MustBeEntityError";
        Object.setPrototypeOf(this, MustBeEntityError.prototype);
        this.message = `Cannot ${operation}, given value must be an entity, instead "${wrongValue}" is given.`;
    }
}
exports.MustBeEntityError = MustBeEntityError;

//# sourceMappingURL=MustBeEntityError.js.map
