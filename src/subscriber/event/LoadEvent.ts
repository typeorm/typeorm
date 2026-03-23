import type { EntityMetadata } from "../../metadata/EntityMetadata"
import type { BaseEvent } from "./BaseEvent"

/**
 * LoadEvent is an object that broadcaster sends to the entity subscriber when an entity is loaded from the database.
 */
export interface LoadEvent<Entity> extends BaseEvent {
    /**
     * Loaded entity.
     */
    entity: Entity

    /**
     * Metadata of the entity.
     */
    metadata: EntityMetadata
}
