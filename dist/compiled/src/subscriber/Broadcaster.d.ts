import { EntitySubscriberInterface } from "./EntitySubscriberInterface";
import { ObjectLiteral } from "../common/ObjectLiteral";
import { QueryRunner } from "../query-runner/QueryRunner";
import { EntityMetadata } from "../metadata/EntityMetadata";
import { BroadcasterResult } from "./BroadcasterResult";
import { ColumnMetadata } from "../metadata/ColumnMetadata";
import { RelationMetadata } from "../metadata/RelationMetadata";
/**
 * Broadcaster provides a helper methods to broadcast events to the subscribers.
 */
export declare class Broadcaster {
    private queryRunner;
    constructor(queryRunner: QueryRunner);
    /**
     * Broadcasts "BEFORE_INSERT" event.
     * Before insert event is executed before entity is being inserted to the database for the first time.
     * All subscribers and entity listeners who listened to this event will be executed at this point.
     * Subscribers and entity listeners can return promises, it will wait until they are resolved.
     *
     * Note: this method has a performance-optimized code organization, do not change code structure.
     */
    broadcastBeforeInsertEvent(result: BroadcasterResult, metadata: EntityMetadata, entity?: ObjectLiteral): void;
    /**
     * Broadcasts "BEFORE_UPDATE" event.
     * Before update event is executed before entity is being updated in the database.
     * All subscribers and entity listeners who listened to this event will be executed at this point.
     * Subscribers and entity listeners can return promises, it will wait until they are resolved.
     *
     * Note: this method has a performance-optimized code organization, do not change code structure.
     */
    broadcastBeforeUpdateEvent(result: BroadcasterResult, metadata: EntityMetadata, entity?: ObjectLiteral, databaseEntity?: ObjectLiteral, updatedColumns?: ColumnMetadata[], updatedRelations?: RelationMetadata[]): void;
    /**
     * Broadcasts "BEFORE_REMOVE" event.
     * Before remove event is executed before entity is being removed from the database.
     * All subscribers and entity listeners who listened to this event will be executed at this point.
     * Subscribers and entity listeners can return promises, it will wait until they are resolved.
     *
     * Note: this method has a performance-optimized code organization, do not change code structure.
     */
    broadcastBeforeRemoveEvent(result: BroadcasterResult, metadata: EntityMetadata, entity?: ObjectLiteral, databaseEntity?: ObjectLiteral): void;
    /**
     * Broadcasts "AFTER_INSERT" event.
     * After insert event is executed after entity is being persisted to the database for the first time.
     * All subscribers and entity listeners who listened to this event will be executed at this point.
     * Subscribers and entity listeners can return promises, it will wait until they are resolved.
     *
     * Note: this method has a performance-optimized code organization, do not change code structure.
     */
    broadcastAfterInsertEvent(result: BroadcasterResult, metadata: EntityMetadata, entity?: ObjectLiteral): void;
    /**
     * Broadcasts "AFTER_UPDATE" event.
     * After update event is executed after entity is being updated in the database.
     * All subscribers and entity listeners who listened to this event will be executed at this point.
     * Subscribers and entity listeners can return promises, it will wait until they are resolved.
     *
     * Note: this method has a performance-optimized code organization, do not change code structure.
     */
    broadcastAfterUpdateEvent(result: BroadcasterResult, metadata: EntityMetadata, entity?: ObjectLiteral, databaseEntity?: ObjectLiteral, updatedColumns?: ColumnMetadata[], updatedRelations?: RelationMetadata[]): void;
    /**
     * Broadcasts "AFTER_REMOVE" event.
     * After remove event is executed after entity is being removed from the database.
     * All subscribers and entity listeners who listened to this event will be executed at this point.
     * Subscribers and entity listeners can return promises, it will wait until they are resolved.
     *
     * Note: this method has a performance-optimized code organization, do not change code structure.
     */
    broadcastAfterRemoveEvent(result: BroadcasterResult, metadata: EntityMetadata, entity?: ObjectLiteral, databaseEntity?: ObjectLiteral): void;
    /**
     * Broadcasts "AFTER_LOAD" event for all given entities, and their sub-entities.
     * After load event is executed after entity has been loaded from the database.
     * All subscribers and entity listeners who listened to this event will be executed at this point.
     * Subscribers and entity listeners can return promises, it will wait until they are resolved.
     *
     * Note: this method has a performance-optimized code organization, do not change code structure.
     */
    broadcastLoadEventsForAll(result: BroadcasterResult, metadata: EntityMetadata, entities: ObjectLiteral[]): void;
    /**
     * Checks if subscriber's methods can be executed by checking if its don't listen to the particular entity,
     * or listens our entity.
     */
    protected isAllowedSubscriber(subscriber: EntitySubscriberInterface<any>, target: Function | string): boolean;
}
