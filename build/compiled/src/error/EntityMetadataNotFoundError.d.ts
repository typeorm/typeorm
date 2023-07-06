import { EntityTarget } from "../common/EntityTarget";
/**
 */
export declare class EntityMetadataNotFoundError extends Error {
    name: string;
    constructor(target: EntityTarget<any>);
}
