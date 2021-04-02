/**
 * Thrown when consumer tries to use query runner from query runner provider after it was released.
 */
export declare class QueryRunnerProviderAlreadyReleasedError extends Error {
    name: string;
    constructor();
}
