/**
 * Thrown when consumer tries to execute operation allowed only if connection is opened.
 */
export declare class CannotExecuteNotConnectedError extends Error {
    name: string;
    constructor(connectionName: string);
}
