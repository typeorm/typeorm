/**
 * Thrown if custom repository was not found.
 */
export class CustomRepositoryNotFoundError extends Error {
    constructor(repository) {
        super();
        this.name = "CustomRepositoryNotFoundError";
        Object.setPrototypeOf(this, CustomRepositoryNotFoundError.prototype);
        this.message = `Custom repository ${repository instanceof Function ? repository.name : repository.constructor.name} was not found. ` +
            `Did you forgot to put @EntityRepository decorator on it?`;
    }
}

//# sourceMappingURL=CustomRepositoryNotFoundError.js.map
