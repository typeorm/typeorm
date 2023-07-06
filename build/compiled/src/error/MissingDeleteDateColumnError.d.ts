import { EntityMetadata } from "../metadata/EntityMetadata";
/**
 */
export declare class MissingDeleteDateColumnError extends Error {
    name: string;
    constructor(entityMetadata: EntityMetadata);
}
