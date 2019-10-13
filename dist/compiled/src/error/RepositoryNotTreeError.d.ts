import { EntitySchema } from "../index";
/**
 * Thrown when repository for the given class is not found.
 */
export declare class RepositoryNotTreeError extends Error {
    name: string;
    constructor(target: Function | EntitySchema<any> | string);
}
