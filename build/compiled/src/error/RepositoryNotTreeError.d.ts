import { EntityTarget } from "../common/EntityTarget";
/**
 * Thrown when repository for the given class is not found.
 */
export declare class RepositoryNotTreeError extends Error {
    name: string;
    constructor(entityClass: EntityTarget<any>);
}
