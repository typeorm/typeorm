/**
 * Thrown when consumer tries to access repository before connection is established.
 */
export class NoConnectionForRepositoryError extends Error {
    constructor(connectionName) {
        super();
        this.name = "NoConnectionForRepositoryError";
        Object.setPrototypeOf(this, NoConnectionForRepositoryError.prototype);
        this.message = `Cannot get a Repository for "${connectionName} connection, because connection with the database ` +
            `is not established yet. Call connection#connect method to establish connection.`;
    }
}

//# sourceMappingURL=NoConnectionForRepositoryError.js.map
