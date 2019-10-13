/**
 * Thrown when user tries to update using QueryBuilder but do not specify what to update.
 */
export declare class UpdateValuesMissingError extends Error {
    name: string;
    constructor();
}
