/**
 * Thrown when consumer tries to get connection that does not exist.
 */
export declare class ConnectionNotFoundError extends Error {
    name: string;
    constructor(name: string);
}
