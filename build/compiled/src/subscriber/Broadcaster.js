"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Broadcaster = void 0;
/**
 * Broadcaster provides a helper methods to broadcast events to the subscribers.
 */
class Broadcaster {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    constructor(queryRunner) {
        this.queryRunner = queryRunner;
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Broadcasts "BEFORE_INSERT" event.
     * Before insert event is executed before entity is being inserted to the database for the first time.
     * All subscribers and entity listeners who listened to this event will be executed at this point.
     * Subscribers and entity listeners can return promises, it will wait until they are resolved.
     *
     * Note: this method has a performance-optimized code organization, do not change code structure.
     */
    broadcastBeforeInsertEvent(result, metadata, entity) {
        if (entity && metadata.beforeInsertListeners.length) {
            metadata.beforeInsertListeners.forEach(listener => {
                if (listener.isAllowed(entity)) {
                    const executionResult = listener.execute(entity);
                    if (executionResult instanceof Promise)
                        result.promises.push(executionResult);
                    result.count++;
                }
            });
        }
        if (this.queryRunner.connection.subscribers.length) {
            this.queryRunner.connection.subscribers.forEach(subscriber => {
                if (this.isAllowedSubscriber(subscriber, metadata.target) && subscriber.beforeInsert) {
                    const executionResult = subscriber.beforeInsert({
                        connection: this.queryRunner.connection,
                        queryRunner: this.queryRunner,
                        manager: this.queryRunner.manager,
                        entity: entity,
                        metadata: metadata
                    });
                    if (executionResult instanceof Promise)
                        result.promises.push(executionResult);
                    result.count++;
                }
            });
        }
    }
    /**
     * Broadcasts "BEFORE_UPDATE" event.
     * Before update event is executed before entity is being updated in the database.
     * All subscribers and entity listeners who listened to this event will be executed at this point.
     * Subscribers and entity listeners can return promises, it will wait until they are resolved.
     *
     * Note: this method has a performance-optimized code organization, do not change code structure.
     */
    broadcastBeforeUpdateEvent(result, metadata, entity, databaseEntity, updatedColumns, updatedRelations) {
        if (entity && metadata.beforeUpdateListeners.length) {
            metadata.beforeUpdateListeners.forEach(listener => {
                if (listener.isAllowed(entity)) {
                    const executionResult = listener.execute(entity);
                    if (executionResult instanceof Promise)
                        result.promises.push(executionResult);
                    result.count++;
                }
            });
        }
        if (this.queryRunner.connection.subscribers.length) {
            this.queryRunner.connection.subscribers.forEach(subscriber => {
                if (this.isAllowedSubscriber(subscriber, metadata.target) && subscriber.beforeUpdate) {
                    const executionResult = subscriber.beforeUpdate({
                        connection: this.queryRunner.connection,
                        queryRunner: this.queryRunner,
                        manager: this.queryRunner.manager,
                        entity: entity,
                        metadata: metadata,
                        databaseEntity: databaseEntity,
                        updatedColumns: updatedColumns || [],
                        updatedRelations: updatedRelations || []
                    });
                    if (executionResult instanceof Promise)
                        result.promises.push(executionResult);
                    result.count++;
                }
            });
        }
    }
    /**
     * Broadcasts "BEFORE_REMOVE" event.
     * Before remove event is executed before entity is being removed from the database.
     * All subscribers and entity listeners who listened to this event will be executed at this point.
     * Subscribers and entity listeners can return promises, it will wait until they are resolved.
     *
     * Note: this method has a performance-optimized code organization, do not change code structure.
     */
    broadcastBeforeRemoveEvent(result, metadata, entity, databaseEntity) {
        if (entity && metadata.beforeRemoveListeners.length) {
            metadata.beforeRemoveListeners.forEach(listener => {
                if (listener.isAllowed(entity)) {
                    const executionResult = listener.execute(entity);
                    if (executionResult instanceof Promise)
                        result.promises.push(executionResult);
                    result.count++;
                }
            });
        }
        if (this.queryRunner.connection.subscribers.length) {
            this.queryRunner.connection.subscribers.forEach(subscriber => {
                if (this.isAllowedSubscriber(subscriber, metadata.target) && subscriber.beforeRemove) {
                    const executionResult = subscriber.beforeRemove({
                        connection: this.queryRunner.connection,
                        queryRunner: this.queryRunner,
                        manager: this.queryRunner.manager,
                        entity: entity,
                        metadata: metadata,
                        databaseEntity: databaseEntity,
                        entityId: metadata.getEntityIdMixedMap(databaseEntity)
                    });
                    if (executionResult instanceof Promise)
                        result.promises.push(executionResult);
                    result.count++;
                }
            });
        }
    }
    /**
     * Broadcasts "AFTER_INSERT" event.
     * After insert event is executed after entity is being persisted to the database for the first time.
     * All subscribers and entity listeners who listened to this event will be executed at this point.
     * Subscribers and entity listeners can return promises, it will wait until they are resolved.
     *
     * Note: this method has a performance-optimized code organization, do not change code structure.
     */
    broadcastAfterInsertEvent(result, metadata, entity) {
        if (entity && metadata.afterInsertListeners.length) {
            metadata.afterInsertListeners.forEach(listener => {
                if (listener.isAllowed(entity)) {
                    const executionResult = listener.execute(entity);
                    if (executionResult instanceof Promise)
                        result.promises.push(executionResult);
                    result.count++;
                }
            });
        }
        if (this.queryRunner.connection.subscribers.length) {
            this.queryRunner.connection.subscribers.forEach(subscriber => {
                if (this.isAllowedSubscriber(subscriber, metadata.target) && subscriber.afterInsert) {
                    const executionResult = subscriber.afterInsert({
                        connection: this.queryRunner.connection,
                        queryRunner: this.queryRunner,
                        manager: this.queryRunner.manager,
                        entity: entity,
                        metadata: metadata
                    });
                    if (executionResult instanceof Promise)
                        result.promises.push(executionResult);
                    result.count++;
                }
            });
        }
    }
    /**
     * Broadcasts "BEFORE_TRANSACTION_START" event.
     */
    broadcastBeforeTransactionStartEvent(result) {
        if (this.queryRunner.connection.subscribers.length) {
            this.queryRunner.connection.subscribers.forEach(subscriber => {
                if (subscriber.beforeTransactionStart) {
                    const executionResult = subscriber.beforeTransactionStart({
                        connection: this.queryRunner.connection,
                        queryRunner: this.queryRunner,
                        manager: this.queryRunner.manager,
                    });
                    if (executionResult instanceof Promise)
                        result.promises.push(executionResult);
                    result.count++;
                }
            });
        }
    }
    /**
     * Broadcasts "AFTER_TRANSACTION_START" event.
     */
    broadcastAfterTransactionStartEvent(result) {
        if (this.queryRunner.connection.subscribers.length) {
            this.queryRunner.connection.subscribers.forEach(subscriber => {
                if (subscriber.afterTransactionStart) {
                    const executionResult = subscriber.afterTransactionStart({
                        connection: this.queryRunner.connection,
                        queryRunner: this.queryRunner,
                        manager: this.queryRunner.manager,
                    });
                    if (executionResult instanceof Promise)
                        result.promises.push(executionResult);
                    result.count++;
                }
            });
        }
    }
    /**
     * Broadcasts "BEFORE_TRANSACTION_COMMIT" event.
     */
    broadcastBeforeTransactionCommitEvent(result) {
        if (this.queryRunner.connection.subscribers.length) {
            this.queryRunner.connection.subscribers.forEach(subscriber => {
                if (subscriber.beforeTransactionCommit) {
                    const executionResult = subscriber.beforeTransactionCommit({
                        connection: this.queryRunner.connection,
                        queryRunner: this.queryRunner,
                        manager: this.queryRunner.manager,
                    });
                    if (executionResult instanceof Promise)
                        result.promises.push(executionResult);
                    result.count++;
                }
            });
        }
    }
    /**
     * Broadcasts "AFTER_TRANSACTION_COMMIT" event.
     */
    broadcastAfterTransactionCommitEvent(result) {
        if (this.queryRunner.connection.subscribers.length) {
            this.queryRunner.connection.subscribers.forEach(subscriber => {
                if (subscriber.afterTransactionCommit) {
                    const executionResult = subscriber.afterTransactionCommit({
                        connection: this.queryRunner.connection,
                        queryRunner: this.queryRunner,
                        manager: this.queryRunner.manager,
                    });
                    if (executionResult instanceof Promise)
                        result.promises.push(executionResult);
                    result.count++;
                }
            });
        }
    }
    /**
     * Broadcasts "BEFORE_TRANSACTION_ROLLBACK" event.
     */
    broadcastBeforeTransactionRollbackEvent(result) {
        if (this.queryRunner.connection.subscribers.length) {
            this.queryRunner.connection.subscribers.forEach(subscriber => {
                if (subscriber.beforeTransactionRollback) {
                    const executionResult = subscriber.beforeTransactionRollback({
                        connection: this.queryRunner.connection,
                        queryRunner: this.queryRunner,
                        manager: this.queryRunner.manager,
                    });
                    if (executionResult instanceof Promise)
                        result.promises.push(executionResult);
                    result.count++;
                }
            });
        }
    }
    /**
     * Broadcasts "AFTER_TRANSACTION_ROLLBACK" event.
     */
    broadcastAfterTransactionRollbackEvent(result) {
        if (this.queryRunner.connection.subscribers.length) {
            this.queryRunner.connection.subscribers.forEach(subscriber => {
                if (subscriber.afterTransactionRollback) {
                    const executionResult = subscriber.afterTransactionRollback({
                        connection: this.queryRunner.connection,
                        queryRunner: this.queryRunner,
                        manager: this.queryRunner.manager,
                    });
                    if (executionResult instanceof Promise)
                        result.promises.push(executionResult);
                    result.count++;
                }
            });
        }
    }
    /**
     * Broadcasts "AFTER_UPDATE" event.
     * After update event is executed after entity is being updated in the database.
     * All subscribers and entity listeners who listened to this event will be executed at this point.
     * Subscribers and entity listeners can return promises, it will wait until they are resolved.
     *
     * Note: this method has a performance-optimized code organization, do not change code structure.
     */
    broadcastAfterUpdateEvent(result, metadata, entity, databaseEntity, updatedColumns, updatedRelations) {
        if (entity && metadata.afterUpdateListeners.length) {
            metadata.afterUpdateListeners.forEach(listener => {
                if (listener.isAllowed(entity)) {
                    const executionResult = listener.execute(entity);
                    if (executionResult instanceof Promise)
                        result.promises.push(executionResult);
                    result.count++;
                }
            });
        }
        if (this.queryRunner.connection.subscribers.length) {
            this.queryRunner.connection.subscribers.forEach(subscriber => {
                if (this.isAllowedSubscriber(subscriber, metadata.target) && subscriber.afterUpdate) {
                    const executionResult = subscriber.afterUpdate({
                        connection: this.queryRunner.connection,
                        queryRunner: this.queryRunner,
                        manager: this.queryRunner.manager,
                        entity: entity,
                        metadata: metadata,
                        databaseEntity: databaseEntity,
                        updatedColumns: updatedColumns || [],
                        updatedRelations: updatedRelations || []
                    });
                    if (executionResult instanceof Promise)
                        result.promises.push(executionResult);
                    result.count++;
                }
            });
        }
    }
    /**
     * Broadcasts "AFTER_REMOVE" event.
     * After remove event is executed after entity is being removed from the database.
     * All subscribers and entity listeners who listened to this event will be executed at this point.
     * Subscribers and entity listeners can return promises, it will wait until they are resolved.
     *
     * Note: this method has a performance-optimized code organization, do not change code structure.
     */
    broadcastAfterRemoveEvent(result, metadata, entity, databaseEntity) {
        if (entity && metadata.afterRemoveListeners.length) {
            metadata.afterRemoveListeners.forEach(listener => {
                if (listener.isAllowed(entity)) {
                    const executionResult = listener.execute(entity);
                    if (executionResult instanceof Promise)
                        result.promises.push(executionResult);
                    result.count++;
                }
            });
        }
        if (this.queryRunner.connection.subscribers.length) {
            this.queryRunner.connection.subscribers.forEach(subscriber => {
                if (this.isAllowedSubscriber(subscriber, metadata.target) && subscriber.afterRemove) {
                    const executionResult = subscriber.afterRemove({
                        connection: this.queryRunner.connection,
                        queryRunner: this.queryRunner,
                        manager: this.queryRunner.manager,
                        entity: entity,
                        metadata: metadata,
                        databaseEntity: databaseEntity,
                        entityId: metadata.getEntityIdMixedMap(databaseEntity)
                    });
                    if (executionResult instanceof Promise)
                        result.promises.push(executionResult);
                    result.count++;
                }
            });
        }
    }
    /**
     * Broadcasts "AFTER_LOAD" event for all given entities, and their sub-entities.
     * After load event is executed after entity has been loaded from the database.
     * All subscribers and entity listeners who listened to this event will be executed at this point.
     * Subscribers and entity listeners can return promises, it will wait until they are resolved.
     *
     * Note: this method has a performance-optimized code organization, do not change code structure.
     */
    broadcastLoadEventsForAll(result, metadata, entities) {
        entities.forEach(entity => {
            if (entity instanceof Promise) // todo: check why need this?
                return;
            // collect load events for all children entities that were loaded with the main entity
            if (metadata.relations.length) {
                metadata.relations.forEach(relation => {
                    // in lazy relations we cannot simply access to entity property because it will cause a getter and a database query
                    if (relation.isLazy && !entity.hasOwnProperty(relation.propertyName))
                        return;
                    const value = relation.getEntityValue(entity);
                    if (value instanceof Object)
                        this.broadcastLoadEventsForAll(result, relation.inverseEntityMetadata, Array.isArray(value) ? value : [value]);
                });
            }
            if (metadata.afterLoadListeners.length) {
                metadata.afterLoadListeners.forEach(listener => {
                    if (listener.isAllowed(entity)) {
                        const executionResult = listener.execute(entity);
                        if (executionResult instanceof Promise)
                            result.promises.push(executionResult);
                        result.count++;
                    }
                });
            }
            if (this.queryRunner.connection.subscribers.length) {
                this.queryRunner.connection.subscribers.forEach(subscriber => {
                    if (this.isAllowedSubscriber(subscriber, metadata.target) && subscriber.afterLoad) {
                        const executionResult = subscriber.afterLoad(entity, {
                            connection: this.queryRunner.connection,
                            queryRunner: this.queryRunner,
                            manager: this.queryRunner.manager,
                            entity: entity,
                            metadata: metadata
                        });
                        if (executionResult instanceof Promise)
                            result.promises.push(executionResult);
                        result.count++;
                    }
                });
            }
        });
    }
    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------
    /**
     * Checks if subscriber's methods can be executed by checking if its don't listen to the particular entity,
     * or listens our entity.
     */
    isAllowedSubscriber(subscriber, target) {
        return !subscriber.listenTo ||
            !subscriber.listenTo() ||
            subscriber.listenTo() === Object ||
            subscriber.listenTo() === target ||
            subscriber.listenTo().isPrototypeOf(target);
    }
}
exports.Broadcaster = Broadcaster;
//# sourceMappingURL=Broadcaster.js.map