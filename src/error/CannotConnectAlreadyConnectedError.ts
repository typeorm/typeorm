/**
 * Thrown when consumer tries to connect when he already connected.
 */
export class CannotConnectAlreadyConnectedError extends Error {
    name = "CannotConnectAlreadyConnectedError";

    constructor(connectionName: string) {
        super();
        Object.setPrototypeOf(this, CannotConnectAlreadyConnectedError.prototype);
        this.message = `Cannot create a "${connectionName}" connection because connection to the database already established.`;
    }

}