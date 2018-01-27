import {EntitySubscriberInterface} from "./EntitySubscriberInterface";
import {EventListenerTypes} from "../metadata/types/EventListenerTypes";
import {ObjectLiteral} from "../common/ObjectLiteral";
import {Subject} from "../persistence/Subject";
import {Connection} from "../connection/Connection";
import {EntityManager} from "../entity-manager/EntityManager";

/**
 * Broadcaster provides a helper methods to broadcast events to the subscribers.
 */
export class Broadcaster {

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(private connection: Connection) {
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Broadcasts "BEFORE_INSERT", "BEFORE_UPDATE", "BEFORE_REMOVE" events for all given subjects.
     */
    async broadcastBeforeEventsForAll(entityManager: EntityManager, insertSubjects: Subject[], updateSubjects: Subject[], removeSubjects: Subject[]): Promise<void> {
        const insertPromises = insertSubjects.map(subject => this.broadcastBeforeInsertEvent(entityManager, subject));
        const updatePromises = updateSubjects.map(subject => this.broadcastBeforeUpdateEvent(entityManager, subject));
        const removePromises = removeSubjects.map(subject => this.broadcastBeforeRemoveEvent(entityManager, subject));
        const allPromises = insertPromises.concat(updatePromises).concat(removePromises);
        await Promise.all(allPromises);
    }

    /**
     * Broadcasts "AFTER_INSERT", "AFTER_UPDATE", "AFTER_REMOVE" events for all given subjects.
     */
    async broadcastAfterEventsForAll(entityManager: EntityManager, insertSubjects: Subject[], updateSubjects: Subject[], removeSubjects: Subject[]): Promise<void> {
        const insertPromises = insertSubjects.map(subject => this.broadcastAfterInsertEvent(entityManager, subject));
        const updatePromises = updateSubjects.map(subject => this.broadcastAfterUpdateEvent(entityManager, subject));
        const removePromises = removeSubjects.map(subject => this.broadcastAfterRemoveEvent(entityManager, subject));
        const allPromises = insertPromises.concat(updatePromises).concat(removePromises);
        await Promise.all(allPromises);
    }

    /**
     * Broadcasts "BEFORE_INSERT" event.
     * Before insert event is executed before entity is being inserted to the database for the first time.
     * All subscribers and entity listeners who listened to this event will be executed at this point.
     * Subscribers and entity listeners can return promises, it will wait until they are resolved.
     */
    async broadcastBeforeInsertEvent(manager: EntityManager, subject: Subject): Promise<void> {

        // console.log(subject.metadata.listeners);
        const listeners = subject.metadata.listeners
            .filter(listener => listener.type === EventListenerTypes.BEFORE_INSERT && listener.isAllowed(subject.entity))
            .map(entityListener => entityListener.execute(subject.entity));

        const subscribers = this.connection.subscribers
            .filter(subscriber => this.isAllowedSubscriber(subscriber, subject.entityTarget!) && subscriber.beforeInsert)
            .map(subscriber => subscriber.beforeInsert!({
                manager: manager,
                entity: subject.entity
            }));

        await Promise.all(listeners.concat(subscribers));
    }

    /**
     * Broadcasts "BEFORE_UPDATE" event.
     * Before update event is executed before entity is being updated in the database.
     * All subscribers and entity listeners who listened to this event will be executed at this point.
     * Subscribers and entity listeners can return promises, it will wait until they are resolved.
     */
    async broadcastBeforeUpdateEvent(manager: EntityManager, subject: Subject): Promise<void> { // todo: send relations too?

        const listeners = subject.metadata.listeners
            .filter(listener => listener.type === EventListenerTypes.BEFORE_UPDATE && listener.isAllowed(subject.entity))
            .map(entityListener => entityListener.execute(subject.entity));

        const subscribers = this.connection.subscribers
            .filter(subscriber => this.isAllowedSubscriber(subscriber, subject.entityTarget!) && subscriber.beforeUpdate)
            .map(subscriber => subscriber.beforeUpdate!({
                manager: manager,
                entity: subject.entity,
                databaseEntity: subject.databaseEntity,
                updatedColumns: subject.diffColumns,
                updatedRelations: subject.diffRelations,
            }));

        await Promise.all(listeners.concat(subscribers));
    }

    /**
     * Broadcasts "BEFORE_REMOVE" event.
     * Before remove event is executed before entity is being removed from the database.
     * All subscribers and entity listeners who listened to this event will be executed at this point.
     * Subscribers and entity listeners can return promises, it will wait until they are resolved.
     */
    async broadcastBeforeRemoveEvent(manager: EntityManager, subject: Subject): Promise<void> {

        const listeners = subject.metadata.listeners
            .filter(listener => listener.type === EventListenerTypes.BEFORE_REMOVE && listener.isAllowed(subject.entity))
            .map(entityListener => entityListener.execute(subject.databaseEntity));

        const subscribers = this.connection.subscribers
            .filter(subscriber => this.isAllowedSubscriber(subscriber, subject.entityTarget!) && subscriber.beforeRemove)
            .map(subscriber => subscriber.beforeRemove!({
                manager: manager,
                entity: subject.hasEntity ? subject.entity : undefined,
                databaseEntity: subject.databaseEntity,
                entityId: subject.metadata.getEntityIdMixedMap(subject.databaseEntity)
            }));

        await Promise.all(listeners.concat(subscribers));
    }

    /**
     * Broadcasts "AFTER_INSERT" event.
     * After insert event is executed after entity is being persisted to the database for the first time.
     * All subscribers and entity listeners who listened to this event will be executed at this point.
     * Subscribers and entity listeners can return promises, it will wait until they are resolved.
     */
    async broadcastAfterInsertEvent(manager: EntityManager, subject: Subject): Promise<void> {

        const listeners = subject.metadata.listeners
            .filter(listener => listener.type === EventListenerTypes.AFTER_INSERT && listener.isAllowed(subject.entity))
            .map(entityListener => entityListener.execute(subject.entity));

        const subscribers = this.connection.subscribers
            .filter(subscriber => this.isAllowedSubscriber(subscriber, subject.entityTarget!) && subscriber.afterInsert)
            .map(subscriber => subscriber.afterInsert!({
                manager: manager,
                entity: subject.entity
            }));

        await Promise.all(listeners.concat(subscribers));
    }

    /**
     * Broadcasts "AFTER_UPDATE" event.
     * After update event is executed after entity is being updated in the database.
     * All subscribers and entity listeners who listened to this event will be executed at this point.
     * Subscribers and entity listeners can return promises, it will wait until they are resolved.
     */
    async broadcastAfterUpdateEvent(manager: EntityManager, subject: Subject): Promise<void> {

        const listeners = subject.metadata.listeners
            .filter(listener => listener.type === EventListenerTypes.AFTER_UPDATE && listener.isAllowed(subject.entity))
            .map(entityListener => entityListener.execute(subject.entity));

        const subscribers = this.connection.subscribers
            .filter(subscriber => this.isAllowedSubscriber(subscriber, subject.entityTarget!) && subscriber.afterUpdate)
            .map(subscriber => subscriber.afterUpdate!({
                manager: manager,
                entity: subject.entity,
                databaseEntity: subject.databaseEntity,
                updatedColumns: subject.diffColumns,
                updatedRelations: subject.diffRelations,
            }));

        await Promise.all(listeners.concat(subscribers));
    }

    /**
     * Broadcasts "AFTER_REMOVE" event.
     * After remove event is executed after entity is being removed from the database.
     * All subscribers and entity listeners who listened to this event will be executed at this point.
     * Subscribers and entity listeners can return promises, it will wait until they are resolved.
     */
    async broadcastAfterRemoveEvent(manager: EntityManager, subject: Subject): Promise<void> {

        const listeners = subject.metadata.listeners
            .filter(listener => listener.type === EventListenerTypes.AFTER_REMOVE && listener.isAllowed(subject.entity))
            .map(entityListener => entityListener.execute(subject.entity));

        const subscribers = this.connection.subscribers
            .filter(subscriber => this.isAllowedSubscriber(subscriber, subject.entityTarget!) && subscriber.afterRemove)
            .map(subscriber => subscriber.afterRemove!({
                manager: manager,
                entity: subject.hasEntity ? subject.entity : undefined,
                databaseEntity: subject.databaseEntity,
                entityId: subject.metadata.getEntityIdMixedMap(subject.databaseEntity)
            }));

        await Promise.all(listeners.concat(subscribers));
    }

    /**
     * Broadcasts "AFTER_LOAD" event for all given entities, and their sub-entities.
     * After load event is executed after entity has been loaded from the database.
     * All subscribers and entity listeners who listened to this event will be executed at this point.
     * Subscribers and entity listeners can return promises, it will wait until they are resolved.
     */
    async broadcastLoadEventsForAll(target: Function|string, entities: ObjectLiteral[]): Promise<void> {
        await Promise.all(entities.map(entity => this.broadcastLoadEvents(target, entity)));
    }

    /**
     * Broadcasts "AFTER_LOAD" event for the given entity and all its sub-entities.
     * After load event is executed after entity has been loaded from the database.
     * All subscribers and entity listeners who listened to this event will be executed at this point.
     * Subscribers and entity listeners can return promises, it will wait until they are resolved.
     */
    async broadcastLoadEvents(target: Function|string, entity: ObjectLiteral): Promise<void> {
        if (entity instanceof Promise) // todo: check why need this?
            return;

        // collect load events for all children entities that were loaded with the main entity
        const children = this.connection.getMetadata(target).relations.reduce((promises, relation) => {
            if (!entity.hasOwnProperty(relation.propertyName))
                return promises;

            const value = relation.getEntityValue(entity);
            if (value instanceof Array) {
                promises = promises.concat(this.broadcastLoadEventsForAll(relation.inverseEntityMetadata.target!, value));
            } else if (value) {
                promises.push(this.broadcastLoadEvents(relation.inverseEntityMetadata.target!, value));
            }

            return promises;
        }, [] as Promise<void>[]);

        const listeners = this.connection.getMetadata(target).listeners
            .filter(listener => listener.type === EventListenerTypes.AFTER_LOAD && listener.isAllowed(entity))
            .map(listener => entity[listener.propertyName]());

        const subscribers = this.connection.subscribers
            .filter(subscriber => this.isAllowedSubscriber(subscriber, target) && subscriber.afterLoad)
            .map(subscriber => subscriber.afterLoad!(entity));

        await Promise.all(children.concat(listeners.concat(subscribers)));
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Checks if subscriber's methods can be executed by checking if its don't listen to the particular entity,
     * or listens our entity.
     */
    protected isAllowedSubscriber(subscriber: EntitySubscriberInterface<any>, target: Function|string): boolean {
        return  !subscriber.listenTo ||
                !subscriber.listenTo() ||
                subscriber.listenTo() === Object ||
                subscriber.listenTo() === target ||
                subscriber.listenTo().isPrototypeOf(target);
    }

}