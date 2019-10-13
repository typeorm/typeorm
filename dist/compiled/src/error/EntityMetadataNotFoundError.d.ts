import { EntitySchema } from "../index";
/**
 */
export declare class EntityMetadataNotFoundError extends Error {
    name: string;
    constructor(target: Function | EntitySchema<any> | string);
}
