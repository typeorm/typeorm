"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomRepositoryDoesNotHaveEntityError = void 0;
/**
 * Thrown if custom repositories that extend AbstractRepository classes does not have managed entity.
 */
class CustomRepositoryDoesNotHaveEntityError extends Error {
    constructor(repository) {
        super();
        this.name = "CustomRepositoryDoesNotHaveEntityError";
        Object.setPrototypeOf(this, CustomRepositoryDoesNotHaveEntityError.prototype);
        this.message = `Custom repository ${repository instanceof Function ? repository.name : repository.constructor.name} does not have managed entity. ` +
            `Did you forget to specify entity for it @EntityRepository(MyEntity)? `;
    }
}
exports.CustomRepositoryDoesNotHaveEntityError = CustomRepositoryDoesNotHaveEntityError;

//# sourceMappingURL=CustomRepositoryDoesNotHaveEntityError.js.map
