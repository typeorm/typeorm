import { TypeORMError } from "./TypeORMError";

/**
 * Thrown when consumer tries to remove a connection from the ConnectionManager, but the connection was not closed yet.
 */
export class CannotRemoveActiveConnectionError extends TypeORMError {
    constructor(connectionName: string) {
        super(
            `Cannot remove a connection named "${connectionName}" from ConnectionManager, ` +
            `because the connection has not yet been closed.`
        );
    }
}
