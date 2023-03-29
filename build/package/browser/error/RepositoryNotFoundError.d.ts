import { EntityTarget } from "../common/EntityTarget";
/**
 * Thrown when repository for the given class is not found.
 */
export declare class RepositoryNotFoundError extends Error {
    name: string;
    constructor(connectionName: string, entityClass: EntityTarget<any>);
}
