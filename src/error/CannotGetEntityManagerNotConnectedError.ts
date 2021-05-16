/**
 * Thrown when consumer tries to access entity manager before connection is established.
 */
export class CannotGetEntityManagerNotConnectedError extends Error {
    name = "CannotGetEntityManagerNotConnectedError";

    constructor(connectionName: string) {
        super();
        Object.setPrototypeOf(this, CannotGetEntityManagerNotConnectedError.prototype);
        this.message = `Cannot get entity manager for "${connectionName}" connection because connection is not yet established.`;
    }

}