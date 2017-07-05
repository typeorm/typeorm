import {EntityManager} from "../../entity-manager/EntityManager";

/**
 * InsertEvent is an object that broadcaster sends to the entity subscriber when entity is inserted to the database.
 */
export interface InsertEvent<Entity> {

    /**
     * Entity managed with connection used for original event.
     * All database operations in the subscribed event listener should be performed using this entity manager instance.
     */
    manager: EntityManager;

    /**
     * Inserting event.
     */
    entity: Entity;

}