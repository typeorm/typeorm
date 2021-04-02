/**
 * Thrown when method expects entity but instead something else is given.
 */
export declare class MustBeEntityError extends Error {
    name: string;
    constructor(operation: string, wrongValue: any);
}
