/**
 * Thrown when consumer tries to access repository before connection is established.
 */
export class NoConnectionForRepositoryError extends Error {
    name = "NoConnectionForRepositoryError";

    constructor(connectionName: string) {
        super();
        this.message = `Cannot get a Repository for "${connectionName} connection, because connection with the database ` +
            `is not established yet. Call connection#connect method to establish connection.`;
        this.stack = new Error().stack;
    }

}