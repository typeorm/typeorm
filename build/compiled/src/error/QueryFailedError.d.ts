/**
 * Thrown when query execution has failed.
*/
export declare class QueryFailedError extends Error {
    constructor(query: string, parameters: any[] | undefined, driverError: any);
}
