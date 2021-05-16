/**
 * Thrown if custom repository was not found.
 */
export class CustomRepositoryNotFoundError extends Error {
    name = "CustomRepositoryNotFoundError";

    constructor(repository: any) {
        super();
        Object.setPrototypeOf(this, CustomRepositoryNotFoundError.prototype);
        this.message = `Custom repository ${repository instanceof Function ? repository.name : repository.constructor.name } was not found. ` +
            `Did you forgot to put @EntityRepository decorator on it?`;
    }

}