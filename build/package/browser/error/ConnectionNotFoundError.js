/**
 * Thrown when consumer tries to get connection that does not exist.
 */
export class ConnectionNotFoundError extends Error {
    constructor(name) {
        super();
        this.name = "ConnectionNotFoundError";
        Object.setPrototypeOf(this, ConnectionNotFoundError.prototype);
        this.message = `Connection "${name}" was not found.`;
    }
}

//# sourceMappingURL=ConnectionNotFoundError.js.map
