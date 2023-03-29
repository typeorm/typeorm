import { ObjectType } from "./ObjectType";
import { EntitySchema } from "..";
/**
 * Entity target.
 */
export declare type EntityTarget<Entity> = ObjectType<Entity> | EntitySchema<Entity> | string | {
    type: Entity;
    name: string;
};
