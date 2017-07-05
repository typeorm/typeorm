/**
 * Thrown if same custom repository instance is reused between different connections.
 */
export class CustomRepositoryReusedError extends Error {
    name = "CustomRepositoryReusedError";

    constructor(repository: any) {
        super(`Custom entity repository ${repository instanceof Function ? repository.name : repository.constructor.name} ` +
            `was already used in the different connection. You can't share entity repositories between different connections ` +
            `when useContainer is set to true for the entity repository.`);
    }

}