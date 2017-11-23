import {EntitySubscriberInterface} from "./EntitySubscriberInterface";
import {EventListenerTypes} from "../metadata/types/EventListenerTypes";
import {ObjectLiteral} from "../common/ObjectLiteral";
import {QueryRunner} from "../query-runner/QueryRunner";
import {EntityMetadata} from "../metadata/EntityMetadata";

/**
 * Broadcaster provides a helper methods to broadcast events to the subscribers.
 */
export class Broadcaster {

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(private queryRunner: QueryRunner) {
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Broadcasts "BEFORE_INSERT" event.
     * Before insert event is executed before entity is being inserted to the database for the first time.
     * All subscribers and entity listeners who listened to this event will be executed at this point.
     * Subscribers and entity listeners can return promises, it will wait until they are resolved.
     */
    async broadcastBeforeInsertEvent(metadata: EntityMetadata, entity?: ObjectLiteral): Promise<void> {

        const listeners = metadata.listeners.map(listener => {
            if (entity && listener.type === EventListenerTypes.BEFORE_INSERT && listener.isAllowed(entity)) {
                return listener.execute(entity);
            }
        });

        const subscribers = this.queryRunner.connection.subscribers
            .filter(subscriber => this.isAllowedSubscriber(subscriber, metadata.target) && subscriber.beforeInsert)
            .map(subscriber => subscriber.beforeInsert!({
                connection: this.queryRunner.connection,
                queryRunner: this.queryRunner,
                manager: this.queryRunner.manager,
                entity: entity
            }));

        await Promise.all(listeners.concat(subscribers));
    }

    /**
     * Broadcasts "BEFORE_UPDATE" event.
     * Before update event is executed before entity is being updated in the database.
     * All subscribers and entity listeners who listened to this event will be executed at this point.
     * Subscribers and entity listeners can return promises, it will wait until they are resolved.
     */
    async broadcastBeforeUpdateEvent(metadata: EntityMetadata, entity?: ObjectLiteral, databaseEntity?: ObjectLiteral): Promise<void> { // todo: send relations too?

        const listeners = metadata.listeners.map(listener => {
            if (entity && listener.type === EventListenerTypes.BEFORE_UPDATE && listener.isAllowed(entity)) {
                return listener.execute(entity);
            }
        });

        const subscribers = this.queryRunner.connection.subscribers
            .filter(subscriber => this.isAllowedSubscriber(subscriber, metadata.target) && subscriber.beforeUpdate)
            .map(subscriber => subscriber.beforeUpdate!({
                connection: this.queryRunner.connection,
                queryRunner: this.queryRunner,
                manager: this.queryRunner.manager,
                entity: entity,
                databaseEntity: databaseEntity,
                updatedColumns: [], // todo: subject.diffColumns,
                updatedRelations: [] // subject.diffRelations,
            }));

        await Promise.all(listeners.concat(subscribers));
    }

    /**
     * Broadcasts "BEFORE_REMOVE" event.
     * Before remove event is executed before entity is being removed from the database.
     * All subscribers and entity listeners who listened to this event will be executed at this point.
     * Subscribers and entity listeners can return promises, it will wait until they are resolved.
     */
    async broadcastBeforeRemoveEvent(metadata: EntityMetadata, entity?: ObjectLiteral, databaseEntity?: ObjectLiteral): Promise<void> {

        const listeners = metadata.listeners.map(listener => {
            if (entity && listener.type === EventListenerTypes.BEFORE_REMOVE && listener.isAllowed(entity)) {
                return listener.execute(entity);
            }
        });

        const subscribers = this.queryRunner.connection.subscribers
            .filter(subscriber => this.isAllowedSubscriber(subscriber, metadata.target) && subscriber.beforeRemove)
            .map(subscriber => subscriber.beforeRemove!({
                connection: this.queryRunner.connection,
                queryRunner: this.queryRunner,
                manager: this.queryRunner.manager,
                entity: entity,
                databaseEntity: databaseEntity,
                entityId: metadata.getEntityIdMixedMap(databaseEntity)
            }));

        await Promise.all(listeners.concat(subscribers));
    }

    /**
     * Broadcasts "AFTER_INSERT" event.
     * After insert event is executed after entity is being persisted to the database for the first time.
     * All subscribers and entity listeners who listened to this event will be executed at this point.
     * Subscribers and entity listeners can return promises, it will wait until they are resolved.
     */
    async broadcastAfterInsertEvent(metadata: EntityMetadata, entity?: ObjectLiteral): Promise<void> {

        const listeners = metadata.listeners.map(listener => {
            if (entity && listener.type === EventListenerTypes.AFTER_INSERT && listener.isAllowed(entity)) {
                return listener.execute(entity);
            }
        });

        const subscribers = this.queryRunner.connection.subscribers
            .filter(subscriber => this.isAllowedSubscriber(subscriber, metadata.target) && subscriber.afterInsert)
            .map(subscriber => subscriber.afterInsert!({
                connection: this.queryRunner.connection,
                queryRunner: this.queryRunner,
                manager: this.queryRunner.manager,
                entity: entity
            }));

        await Promise.all(listeners.concat(subscribers));
    }

    /**
     * Broadcasts "AFTER_UPDATE" event.
     * After update event is executed after entity is being updated in the database.
     * All subscribers and entity listeners who listened to this event will be executed at this point.
     * Subscribers and entity listeners can return promises, it will wait until they are resolved.
     */
    async broadcastAfterUpdateEvent(metadata: EntityMetadata, entity?: ObjectLiteral, databaseEntity?: ObjectLiteral): Promise<void> {

        const listeners = metadata.listeners.map(listener => {
            if (entity && listener.type === EventListenerTypes.AFTER_UPDATE && listener.isAllowed(entity)) {
                return listener.execute(entity);
            }
        });

        const subscribers = this.queryRunner.connection.subscribers
            .filter(subscriber => this.isAllowedSubscriber(subscriber, metadata.target) && subscriber.afterUpdate)
            .map(subscriber => subscriber.afterUpdate!({
                connection: this.queryRunner.connection,
                queryRunner: this.queryRunner,
                manager: this.queryRunner.manager,
                entity: entity,
                databaseEntity: databaseEntity,
                updatedColumns: [], // todo: subject.diffColumns,
                updatedRelations: [] // todo: subject.diffRelations,
            }));

        await Promise.all(listeners.concat(subscribers));
    }

    /**
     * Broadcasts "AFTER_REMOVE" event.
     * After remove event is executed after entity is being removed from the database.
     * All subscribers and entity listeners who listened to this event will be executed at this point.
     * Subscribers and entity listeners can return promises, it will wait until they are resolved.
     */
    async broadcastAfterRemoveEvent(metadata: EntityMetadata, entity?: ObjectLiteral, databaseEntity?: ObjectLiteral): Promise<void> {

        const listeners = metadata.listeners.map(listener => {
            if (entity && listener.type === EventListenerTypes.AFTER_REMOVE && listener.isAllowed(entity)) {
                return listener.execute(entity);
            }
        });

        const subscribers = this.queryRunner.connection.subscribers
            .filter(subscriber => this.isAllowedSubscriber(subscriber, metadata.target) && subscriber.afterRemove)
            .map(subscriber => subscriber.afterRemove!({
                connection: this.queryRunner.connection,
                queryRunner: this.queryRunner,
                manager: this.queryRunner.manager,
                entity: entity,
                databaseEntity: databaseEntity,
                entityId: metadata.getEntityIdMixedMap(databaseEntity)
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
        const children = this.queryRunner.connection.getMetadata(target).relations.reduce((promises, relation) => {
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

        const listeners = this.queryRunner.connection.getMetadata(target).listeners
            .filter(listener => listener.type === EventListenerTypes.AFTER_LOAD && listener.isAllowed(entity))
            .map(listener => entity[listener.propertyName]());

        const subscribers = this.queryRunner.connection.subscribers
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
                subscriber.listenTo() === target;
    }

}