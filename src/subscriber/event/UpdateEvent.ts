import {ColumnMetadata} from "../../metadata/ColumnMetadata";
import {RelationMetadata} from "../../metadata/RelationMetadata";
import {EntityManager} from "../../entity-manager/EntityManager";

/**
 * UpdateEvent is an object that broadcaster sends to the entity subscriber when entity is being updated in the database.
 */
export interface UpdateEvent<Entity> {

    /**
     * Entity managed with connection used for original event.
     * All database operations in the subscribed event listener should be performed using this entity manager instance.
     */
    manager: EntityManager;

    /**
     * Updating entity.
     */
    entity: Entity;

    /**
     * Updating entity in the database.
     */
    databaseEntity: Entity;

    /**
     * List of updated columns.
     */
    updatedColumns: ColumnMetadata[];

    /**
     * List of updated relations.
     */
    updatedRelations: RelationMetadata[];

    // todo: send old and new update values
    // todo: send updated relations?

}