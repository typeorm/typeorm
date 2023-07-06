/**
 * Thrown when consumer tries to access entity manager before connection is established.
 */
export declare class CannotGetEntityManagerNotConnectedError extends Error {
    name: string;
    constructor(connectionName: string);
}
