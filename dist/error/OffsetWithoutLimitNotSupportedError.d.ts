/**
 * Thrown when user tries to build SELECT query using OFFSET without LIMIT applied but database does not support it.
*/
export declare class OffsetWithoutLimitNotSupportedError extends Error {
    name: string;
    constructor(driverName: string);
}
