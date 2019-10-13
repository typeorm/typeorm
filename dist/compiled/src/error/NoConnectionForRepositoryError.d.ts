/**
 * Thrown when consumer tries to access repository before connection is established.
 */
export declare class NoConnectionForRepositoryError extends Error {
    name: string;
    constructor(connectionName: string);
}
