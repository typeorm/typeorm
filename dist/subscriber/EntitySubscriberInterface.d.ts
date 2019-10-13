import { UpdateEvent } from "./event/UpdateEvent";
import { RemoveEvent } from "./event/RemoveEvent";
import { InsertEvent } from "./event/InsertEvent";
import { LoadEvent } from "./event/LoadEvent";
/**
 * Classes that implement this interface are subscribers that subscribe for the specific events in the ORM.
 */
export interface EntitySubscriberInterface<Entity = any> {
    /**
     * Returns the class of the entity to which events will listen.
     * If this method is omitted, then subscriber will listen to events of all entities.
     */
    listenTo?(): Function;
    /**
     * Called after entity is loaded from the database.
     *
     * For backward compatibility this signature is slightly different from the
     * others.  `event` was added later but is always provided (it is only
     * optional in the signature so that its introduction does not break
     * compilation for existing subscribers).
     */
    afterLoad?(entity: Entity, event?: LoadEvent<Entity>): Promise<any> | void;
    /**
     * Called before entity is inserted to the database.
     */
    beforeInsert?(event: InsertEvent<Entity>): Promise<any> | void;
    /**
     * Called after entity is inserted to the database.
     */
    afterInsert?(event: InsertEvent<Entity>): Promise<any> | void;
    /**
     * Called before entity is updated in the database.
     */
    beforeUpdate?(event: UpdateEvent<Entity>): Promise<any> | void;
    /**
     * Called after entity is updated in the database.
     */
    afterUpdate?(event: UpdateEvent<Entity>): Promise<any> | void;
    /**
     * Called before entity is removed from the database.
     */
    beforeRemove?(event: RemoveEvent<Entity>): Promise<any> | void;
    /**
     * Called after entity is removed from the database.
     */
    afterRemove?(event: RemoveEvent<Entity>): Promise<any> | void;
}
