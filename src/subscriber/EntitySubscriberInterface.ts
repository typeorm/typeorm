import {UpdateEvent} from "./event/UpdateEvent";
import {RemoveEvent} from "./event/RemoveEvent";
import {InsertEvent} from "./event/InsertEvent";
import { BulkLoadEvent } from "./event/BulkLoadEvent";
import { BulkInsertEvent } from "./event/BulkInsertEvent";
import { BulkUpdateEvent } from "./event/BulkUpdateEvent";
import { BulkRemoveEvent } from "./event/BulkRemoveEvent";

/**
 * Classes that implement this interface are subscribers that subscribe for the specific events in the ORM.
 */
export interface EntitySubscriberInterface<Entity = any> {

    /**
     * Returns the class of the entity to which events will listen.
     * If this method is omitted, then subscriber will listen to events of all entities.
     */
    listenTo?(): Function|string; // todo: check how its going to work with entity schemas and string names

    /**
     * Called after entity is loaded from the database.
     */
    afterLoad?(entity: Entity): Promise<any>|void;

    /**
     * Called after entities are loaded from the database.
     */
    afterBulkLoad?(event: BulkLoadEvent<Entity>): Promise<any>|void;

    /**
     * Called before entity is inserted to the database.
     */
    beforeInsert?(event: InsertEvent<Entity>): Promise<any>|void;

    /**
     * Called before entities are inserted to the database.
     */
    beforeBulkInsert?(event: BulkInsertEvent<Entity>): Promise<any>|void;

    /**
     * Called after entity is inserted to the database.
     */
    afterInsert?(event: InsertEvent<Entity>): Promise<any>|void;

    /**
     * Called after entities are inserted to the database.
     */
    afterBulkInsert?(event: BulkInsertEvent<Entity>): Promise<any>|void;

    /**
     * Called before entity is updated in the database.
     */
    beforeUpdate?(event: UpdateEvent<Entity>): Promise<any>|void;

    /**
     * Called before entities are updated in the database.
     */
    beforeBulkUpdate?(event: BulkUpdateEvent<Entity>): Promise<any>|void;

    /**
     * Called after entity is updated in the database.
     */
    afterUpdate?(event: UpdateEvent<Entity>): Promise<any>|void;

    /**
     * Called after entities are updated in the database.
     */
    afterBulkUpdate?(event: BulkUpdateEvent<Entity>): Promise<any>|void;

    /**
     * Called before entity is removed from the database.
     */
    beforeRemove?(event: RemoveEvent<Entity>): Promise<any>|void;

    /**
     * Called before entities are removed from the database.
     */
    beforeBulkRemove?(event: BulkRemoveEvent<Entity>): Promise<any>|void;

    /**
     * Called after entity is removed from the database.
     */
    afterRemove?(event: RemoveEvent<Entity>): Promise<any>|void;

    /**
     * Called after entities are removed from the database.
     */
    afterBulkRemove?(event: BulkRemoveEvent<Entity>): Promise<any>|void;

}