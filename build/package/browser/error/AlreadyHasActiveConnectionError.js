/**
 * Thrown when consumer tries to recreate connection with the same name, but previous connection was not closed yet.
 */
export class AlreadyHasActiveConnectionError extends Error {
    constructor(connectionName) {
        super();
        this.name = "AlreadyHasActiveConnectionError";
        Object.setPrototypeOf(this, AlreadyHasActiveConnectionError.prototype);
        this.message = `Cannot create a new connection named "${connectionName}", because connection with such name ` +
            `already exist and it now has an active connection session.`;
    }
}

//# sourceMappingURL=AlreadyHasActiveConnectionError.js.map
