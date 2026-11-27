import type { ObjectLiteral } from "../../common/ObjectLiteral"
import type { ColumnMetadata } from "../../metadata/ColumnMetadata"
import type { EntityMetadata } from "../../metadata/EntityMetadata"
import type { RelationMetadata } from "../../metadata/RelationMetadata"
import type { BaseEvent } from "./BaseEvent"

/**
 * UpdateEvent is an object that broadcaster sends to the entity subscriber when entity is being updated in the database.
 */
export interface UpdateEvent<Entity> extends BaseEvent {
    /**
     * Updating entity.
     *
     * Contains the same data that was passed to the updating method, be it the instance of an entity or the partial entity.
     */
    entity: ObjectLiteral | undefined

    /**
     * Metadata of the entity.
     */
    metadata: EntityMetadata

    /**
     * Updating entity in the database.
     *
     * Is set only when one of the following methods are used: .save(), .remove(), .softRemove(), and .recover()
     */
    databaseEntity: Entity

    /**
     * List of updated columns. In query builder has no affected
     */
    updatedColumns: ColumnMetadata[]

    /**
     * List of updated relations. In query builder has no affected
     */
    updatedRelations: RelationMetadata[]
}
