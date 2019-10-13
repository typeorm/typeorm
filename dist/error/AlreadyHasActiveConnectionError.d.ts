/**
 * Thrown when consumer tries to recreate connection with the same name, but previous connection was not closed yet.
 */
export declare class AlreadyHasActiveConnectionError extends Error {
    name: string;
    constructor(connectionName: string);
}
