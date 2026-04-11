import type { ObjectLiteral } from "../../common/ObjectLiteral"
import type { EntityMetadata } from "../../metadata/EntityMetadata"
import type { BaseEvent } from "./BaseEvent"

/**
 * InsertEvent is an object that broadcaster sends to the entity subscriber when entity is inserted to the database.
 */
export interface InsertEvent<Entity> extends BaseEvent {
    /**
     * Inserting event.
     */
    entity: Entity

    /**
     * Id or ids of the entity being inserted.
     */
    entityId?: ObjectLiteral

    /**
     * Metadata of the entity.
     */
    metadata: EntityMetadata
}
