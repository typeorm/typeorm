/**
 * Thrown when consumer tries to get connection that does not exist.
 */
export class ConnectionNotFoundError extends Error {
    name = "ConnectionNotFoundError";

    constructor(name: string) {
        super();
        this.message = `Connection "${name}" was not found.`;
        this.stack = new Error().stack;
    }

}