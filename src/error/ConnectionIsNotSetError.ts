/**
 * Thrown when user tries to execute operation that requires connection to be established.
 */
export class ConnectionIsNotSetError extends Error {
    name = "ConnectionIsNotSetError";

    constructor(dbType: string) {
        super();
        this.message = `Connection with ${dbType} database is not established. Check connection configuration.`;
    }

}