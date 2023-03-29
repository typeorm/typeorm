/**
 * Thrown when relations specified in the find options were not found in the entities.
*/
export declare class FindRelationsNotFoundError extends Error {
    constructor(notFoundRelations: string[]);
}
