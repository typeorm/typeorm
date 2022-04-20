/**
 * Thrown when consumer tries to connect when he already connected.
 */
export declare class CannotConnectAlreadyConnectedError extends Error {
    name: string;
    constructor(connectionName: string);
}
