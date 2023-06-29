"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomRepositoryCannotInheritRepositoryError = void 0;
/**
 * Thrown if custom repository inherits Repository class however entity is not set in @EntityRepository decorator.
 */
class CustomRepositoryCannotInheritRepositoryError extends Error {
    constructor(repository) {
        super();
        this.name = "CustomRepositoryCannotInheritRepositoryError";
        Object.setPrototypeOf(this, CustomRepositoryCannotInheritRepositoryError.prototype);
        this.message = `Custom entity repository ${repository instanceof Function ? repository.name : repository.constructor.name} ` +
            ` cannot inherit Repository class without entity being set in the @EntityRepository decorator.`;
    }
}
exports.CustomRepositoryCannotInheritRepositoryError = CustomRepositoryCannotInheritRepositoryError;

//# sourceMappingURL=CustomRepositoryCannotInheritRepositoryError.js.map
