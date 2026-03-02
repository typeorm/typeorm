import { EntitySchema } from "../entity-schema/EntitySchema"
import { ObjectType } from "./ObjectType"

/**
 * Entity target.
 */
export type EntityTarget<Entity> =
    | ObjectType<Entity>
    | EntitySchema<Entity>
    | string
    | { type: Entity; name: string }
