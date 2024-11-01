import { RemoveEvent } from "./RemoveEvent"

/**
 * SoftRemoveEvent is an object that broadcaster sends to the entity subscriber when entity is being soft removed to the database.
 */
export interface SoftRemoveEvent<Entity> extends RemoveEvent<Entity> {
    /** The query that was executed and any parameters bound to it */
    queryAndParameters?: [string, any[]]
}
