import { EntityMetadata } from "../metadata/EntityMetadata";
/**
 */
export declare class MissingPrimaryColumnError extends Error {
    name: string;
    constructor(entityMetadata: EntityMetadata);
}
