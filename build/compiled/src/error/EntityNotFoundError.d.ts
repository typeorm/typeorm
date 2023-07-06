import { EntityTarget } from "../common/EntityTarget";
/**
 * Thrown when no result could be found in methods which are not allowed to return undefined or an empty set.
 */
export declare class EntityNotFoundError extends Error {
    name: string;
    constructor(entityClass: EntityTarget<any>, criteria: any);
    private stringifyCriteria;
}
