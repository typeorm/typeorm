/**
 * Thrown when repository for the given class is not found.
 */
export class RepositoryNotFoundError extends Error {
    name = "RepositoryNotFoundError";

    constructor(connectionName: string, entityClass: Function|string) {
        super();
        const targetName = typeof entityClass === "function" && (<any> entityClass).name ? (<any> entityClass).name : entityClass;
        this.message = `No repository for "${targetName}" was found. Looks like this entity is not registered in ` +
            `current "${connectionName}" connection?`;
        this.stack = new Error().stack;
    }

}