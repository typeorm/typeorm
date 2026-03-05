import type { EntitySchema } from "../entity-schema/EntitySchema"
import type { ObjectType } from "./ObjectType"

/**
 * Entity target.
 */
export type EntityTarget<Entity> =
    | ObjectType<Entity>
    | EntitySchema<Entity>
    | string
    | { type: Entity; name: string }
