/**
 * Thrown when user tries to insert using QueryBuilder but do not specify what to insert.
 */
export declare class InsertValuesMissingError extends Error {
    name: string;
    constructor();
}
