/**
 * Thrown when consumer tries to release entity manager that does not use single database connection.
 */
export declare class NoNeedToReleaseEntityManagerError extends Error {
    name: string;
    constructor();
}
