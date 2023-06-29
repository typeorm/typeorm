"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomRepositoryNotFoundError = void 0;
/**
 * Thrown if custom repository was not found.
 */
class CustomRepositoryNotFoundError extends Error {
    constructor(repository) {
        super();
        this.name = "CustomRepositoryNotFoundError";
        Object.setPrototypeOf(this, CustomRepositoryNotFoundError.prototype);
        this.message = `Custom repository ${repository instanceof Function ? repository.name : repository.constructor.name} was not found. ` +
            `Did you forgot to put @EntityRepository decorator on it?`;
    }
}
exports.CustomRepositoryNotFoundError = CustomRepositoryNotFoundError;

//# sourceMappingURL=CustomRepositoryNotFoundError.js.map
