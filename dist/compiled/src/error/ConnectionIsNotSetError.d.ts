/**
 * Thrown when user tries to execute operation that requires connection to be established.
 */
export declare class ConnectionIsNotSetError extends Error {
    name: string;
    constructor(dbType: string);
}
