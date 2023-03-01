import { ObjectType } from "./ObjectType"
import { EntitySchema } from ".."

/**
 * Entity target.
 *
 * A type that describes the target of a database query or transaction involving an entity.
 *
 * @typeParam Entity - The type of the entity.
 */
export type EntityTarget<Entity> =
    // A reference to an ObjectType that represents the entity.
    | ObjectType<Entity>
    // A reference to an EntitySchema that represents the entity.
    | EntitySchema<Entity>
    // A string that represents the name of the entity.
    | string
    // An object that specifies both the type and name of the entity.
    | { type: Entity; name: string }
