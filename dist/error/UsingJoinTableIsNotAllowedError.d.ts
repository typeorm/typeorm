import { EntityMetadata } from "../metadata/EntityMetadata";
import { RelationMetadata } from "../metadata/RelationMetadata";
/**
 */
export declare class UsingJoinTableIsNotAllowedError extends Error {
    name: string;
    constructor(entityMetadata: EntityMetadata, relation: RelationMetadata);
}
