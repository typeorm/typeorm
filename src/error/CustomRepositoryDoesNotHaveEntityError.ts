/**
 * Thrown if custom repositories that extend AbstractRepository classes does not have managed entity.
 */
export class CustomRepositoryDoesNotHaveEntityError extends Error {
    name = "CustomRepositoryDoesNotHaveEntityError";

    constructor(repository: any) {
        super();
        Object.setPrototypeOf(this, CustomRepositoryDoesNotHaveEntityError.prototype);
        this.message = `Custom repository ${repository instanceof Function ? repository.name : repository.constructor.name} does not have managed entity. ` +
            `Did you forget to specify entity for it @EntityRepository(MyEntity)? `;
    }

}