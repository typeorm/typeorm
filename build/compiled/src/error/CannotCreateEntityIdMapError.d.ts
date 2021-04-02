import { EntityMetadata } from "../metadata/EntityMetadata";
/**
 * Thrown when user tries to create entity id map from the mixed id value,
 * but id value is a single value when entity requires multiple values.
 */
export declare class CannotCreateEntityIdMapError extends Error {
    name: string;
    constructor(metadata: EntityMetadata, id: any);
}
