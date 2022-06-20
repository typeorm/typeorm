import { TypeORMError } from "./TypeORMError";
/**
 * Thrown when query execution has failed.
 */
export declare class QueryFailedError extends TypeORMError {
    readonly query: string;
    readonly parameters: any[] | undefined;
    readonly driverError: any;
    constructor(query: string, parameters: any[] | undefined, driverError: any);
}
