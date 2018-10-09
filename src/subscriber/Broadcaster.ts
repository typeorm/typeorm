import {EntitySubscriberInterface} from "./EntitySubscriberInterface";
import {ObjectLiteral} from "../common/ObjectLiteral";
import {QueryRunner} from "../query-runner/QueryRunner";
import {EntityMetadata} from "../metadata/EntityMetadata";
import {BroadcasterResult} from "./BroadcasterResult";
import {ColumnMetadata} from "../metadata/ColumnMetadata";
import {RelationMetadata} from "../metadata/RelationMetadata";

type EntitiesByMetadata = {
    [target: string]: {
        metadata: EntityMetadata,
        entities: ObjectLiteral[],
    },
};

export type SubjectsByMetadata<T extends BroadcasterSubject> = {
    [target: string]: {
        metadata: EntityMetadata,
        subjects: T[],
    },
};

export type BroadcasterSubject = {
    metadata: EntityMetadata,
    entity?: ObjectLiteral,
};

export type BroadcasterInsertSubject = BroadcasterSubject;

export type BroadcasterUpdateSubject = BroadcasterSubject & {
    databaseEntity?: ObjectLiteral;
    diffColumns?: ColumnMetadata[];
    diffRelations?: RelationMetadata[];
};

export type BroadcasterRemoveSubject = BroadcasterSubject & {
    databaseEntity?: ObjectLiteral
};

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
     *
     * Note: this method has a performance-optimized code organization, do not change code structure.
     */
    broadcastBeforeInsertEvent(result: BroadcasterResult, subjects: BroadcasterInsertSubject[]): void {
        // Check if there are any subscribers to beforeBulkInsert. If there aren't, we don't need to keep the entitiesByMetadata cache
        const bulkSubscribers = this.queryRunner.connection.subscribers.filter(subscriber => !!subscriber.beforeBulkInsert);
        const subjectsByMetadata: SubjectsByMetadata<BroadcasterInsertSubject> | undefined = bulkSubscribers.length ? {} : undefined;

        subjects.forEach((subject) => {
            const {
                metadata,
                entity,
            } = subject;

            this.addEntityToMetadataMap(subjectsByMetadata, subject);

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
                            metadata: metadata,
                            entity: entity
                        });
                        if (executionResult instanceof Promise)
                            result.promises.push(executionResult);
                        result.count++;
                    }
                });
            }
        });

        if (subjectsByMetadata) {
            const targets = Object.keys(subjectsByMetadata);
            for (const target of targets) {
                const {
                    metadata,
                    subjects,
                } = subjectsByMetadata[target];

                bulkSubscribers.forEach(subscriber => {
                    if (this.isAllowedSubscriber(subscriber, metadata.target)) {
                        const executionResult = subscriber.beforeBulkInsert!({
                            connection: this.queryRunner.connection,
                            queryRunner: this.queryRunner,
                            manager: this.queryRunner.manager,
                            metadata,
                            entities: subjects.map(subject => subject.entity),
                        });
                        if (executionResult instanceof Promise)
                            result.promises.push(executionResult);
                        result.count++;
                    }
                });
            }
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
    broadcastBeforeUpdateEvent(result: BroadcasterResult, subjects: BroadcasterUpdateSubject[]): void { // todo: send relations too?
        // Check if there are any subscribers to beforeBulkUpdate. If there aren't, we don't need to keep the entitiesByMetadata cache
        const bulkSubscribers = this.queryRunner.connection.subscribers.filter(subscriber => !!subscriber.beforeBulkUpdate);
        const subjectsByMetadata: SubjectsByMetadata<BroadcasterUpdateSubject> | undefined = bulkSubscribers.length ? {} : undefined;

        subjects.forEach((subject) => {
            const {
                metadata,
                entity,
                databaseEntity,
            } = subject;

            this.addEntityToMetadataMap(subjectsByMetadata, subject);

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
                            metadata: metadata,
                            entity: entity,
                            databaseEntity: databaseEntity,
                            updatedColumns: subject.diffColumns || [],
                            updatedRelations: subject.diffRelations || [],
                        });
                        if (executionResult instanceof Promise)
                            result.promises.push(executionResult);
                        result.count++;
                    }
                });
            }
        });

        if (subjectsByMetadata) {
            const targets = Object.keys(subjectsByMetadata);
            for (const target of targets) {
                const {
                    metadata,
                    subjects,
                } = subjectsByMetadata[target];

                const updates = subjects.map(subject => ({
                    entity: subject.entity,
                    databaseEntity: subject.databaseEntity,
                    updatedColumns: subject.diffColumns || [],
                    updatedRelations: subject.diffRelations || [],
                }));

                bulkSubscribers.forEach(subscriber => {
                    if (this.isAllowedSubscriber(subscriber, metadata.target)) {
                        const executionResult = subscriber.beforeBulkUpdate!({
                            connection: this.queryRunner.connection,
                            queryRunner: this.queryRunner,
                            manager: this.queryRunner.manager,
                            metadata,
                            updates,
                        });
                        if (executionResult instanceof Promise)
                            result.promises.push(executionResult);
                        result.count++;
                    }
                });
            }
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
    broadcastBeforeRemoveEvent(result: BroadcasterResult, subjects: BroadcasterRemoveSubject[]): void {
        // Check if there are any subscribers to beforeBulkRemove. If there aren't, we don't need to keep the entitiesByMetadata cache
        const bulkSubscribers = this.queryRunner.connection.subscribers.filter(subscriber => !!subscriber.beforeBulkRemove);
        const subjectsByMetadata: SubjectsByMetadata<BroadcasterRemoveSubject> | undefined = bulkSubscribers.length ? {} : undefined;

        subjects.forEach((subject) => {
            const {
                metadata,
                entity,
                databaseEntity,
            } = subject;

            this.addEntityToMetadataMap(subjectsByMetadata, subject);

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
                            metadata: metadata,
                            entity: entity,
                            databaseEntity: databaseEntity,
                            entityId: metadata.getEntityIdMixedMap(databaseEntity)
                        });
                        if (executionResult instanceof Promise)
                            result.promises.push(executionResult);
                        result.count++;
                    }
                });
            }
        });

        if (subjectsByMetadata) {
            const targets = Object.keys(subjectsByMetadata);
            for (const target of targets) {
                const {
                    metadata,
                    subjects,
                } = subjectsByMetadata[target];

                const removals = subjects.map(subject => ({
                    entity: subject.entity,
                    databaseEntity: subject.databaseEntity,
                    entityId: metadata.getEntityIdMixedMap(subject.databaseEntity),
                }));

                bulkSubscribers.forEach(subscriber => {
                    if (this.isAllowedSubscriber(subscriber, metadata.target)) {
                        const executionResult = subscriber.beforeBulkRemove!({
                            connection: this.queryRunner.connection,
                            queryRunner: this.queryRunner,
                            manager: this.queryRunner.manager,
                            metadata,
                            removals,
                        });
                        if (executionResult instanceof Promise)
                            result.promises.push(executionResult);
                        result.count++;
                    }
                });
            }
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
    broadcastAfterInsertEvent(result: BroadcasterResult, subjects: BroadcasterInsertSubject[]): void {
        // Check if there are any subscribers to afterBulkInsert. If there aren't, we don't need to keep the entitiesByMetadata cache
        const bulkSubscribers = this.queryRunner.connection.subscribers.filter(subscriber => !!subscriber.afterBulkInsert);
        const subjectsByMetadata: SubjectsByMetadata<BroadcasterInsertSubject> | undefined = bulkSubscribers.length ? {} : undefined;

        subjects.forEach((subject) => {
            const {
                metadata,
                entity,
            } = subject;

            this.addEntityToMetadataMap(subjectsByMetadata, subject);

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
                            metadata: metadata,
                            entity: entity
                        });
                        if (executionResult instanceof Promise)
                            result.promises.push(executionResult);
                        result.count++;
                    }
                });
            }
        });

        if (subjectsByMetadata) {
            const targets = Object.keys(subjectsByMetadata);
            for (const target of targets) {
                const {
                    metadata,
                    subjects,
                } = subjectsByMetadata[target];

                bulkSubscribers.forEach(subscriber => {
                    if (this.isAllowedSubscriber(subscriber, metadata.target)) {
                        const executionResult = subscriber.afterBulkInsert!({
                            connection: this.queryRunner.connection,
                            queryRunner: this.queryRunner,
                            manager: this.queryRunner.manager,
                            metadata,
                            entities: subjects.map(subject => subject.entity),
                        });
                        if (executionResult instanceof Promise)
                            result.promises.push(executionResult);
                        result.count++;
                    }
                });
            }
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
    broadcastAfterUpdateEvent(result: BroadcasterResult, subjects: BroadcasterUpdateSubject[]): void {
        // Check if there are any subscribers to afterBulkUpdate. If there aren't, we don't need to keep the entitiesByMetadata cache
        const bulkSubscribers = this.queryRunner.connection.subscribers.filter(subscriber => !!subscriber.afterBulkUpdate);
        const subjectsByMetadata: SubjectsByMetadata<BroadcasterUpdateSubject> | undefined = bulkSubscribers.length ? {} : undefined;

        subjects.forEach((subject) => {
            const {
                metadata,
                entity,
                databaseEntity,
            } = subject;

            this.addEntityToMetadataMap(subjectsByMetadata, subject);

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
                            metadata: metadata,
                            entity: entity,
                            databaseEntity: databaseEntity,
                            updatedColumns: subject.diffColumns || [],
                            updatedRelations: subject.diffRelations || [],
                        });
                        if (executionResult instanceof Promise)
                            result.promises.push(executionResult);
                        result.count++;
                    }
                });
            }
        });

        if (subjectsByMetadata) {
            const targets = Object.keys(subjectsByMetadata);
            for (const target of targets) {
                const {
                    metadata,
                    subjects,
                } = subjectsByMetadata[target];

                const updates = subjects.map(subject => ({
                    entity: subject.entity,
                    databaseEntity: subject.databaseEntity,
                    updatedColumns: subject.diffColumns || [],
                    updatedRelations: subject.diffRelations || [],
                }));

                bulkSubscribers.forEach(subscriber => {
                    if (this.isAllowedSubscriber(subscriber, metadata.target)) {
                        const executionResult = subscriber.afterBulkUpdate!({
                            connection: this.queryRunner.connection,
                            queryRunner: this.queryRunner,
                            manager: this.queryRunner.manager,
                            metadata,
                            updates,
                        });
                        if (executionResult instanceof Promise)
                            result.promises.push(executionResult);
                        result.count++;
                    }
                });
            }
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
    broadcastAfterRemoveEvent(result: BroadcasterResult, subjects: BroadcasterRemoveSubject[]): void {
        // Check if there are any subscribers to afterBulkRemove. If there aren't, we don't need to keep the entitiesByMetadata cache
        const bulkSubscribers = this.queryRunner.connection.subscribers.filter(subscriber => !!subscriber.afterBulkRemove);
        const subjectsByMetadata: SubjectsByMetadata<BroadcasterRemoveSubject> | undefined = bulkSubscribers.length ? {} : undefined;

        subjects.forEach((subject) => {
            const {
                metadata,
                entity,
                databaseEntity,
            } = subject;

            this.addEntityToMetadataMap(subjectsByMetadata, subject);

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
                            metadata: metadata,
                            entity: entity,
                            databaseEntity: databaseEntity,
                            entityId: metadata.getEntityIdMixedMap(databaseEntity)
                        });
                        if (executionResult instanceof Promise)
                            result.promises.push(executionResult);
                        result.count++;
                    }
                });
            }
        });

        if (subjectsByMetadata) {
            const targets = Object.keys(subjectsByMetadata);
            for (const target of targets) {
                const {
                    metadata,
                    subjects,
                } = subjectsByMetadata[target];

                const removals = subjects.map(subject => ({
                    entity: subject.entity,
                    databaseEntity: subject.databaseEntity,
                    entityId: metadata.getEntityIdMixedMap(subject.databaseEntity),
                }));

                bulkSubscribers.forEach(subscriber => {
                    if (this.isAllowedSubscriber(subscriber, metadata.target)) {
                        const executionResult = subscriber.afterBulkRemove!({
                            connection: this.queryRunner.connection,
                            queryRunner: this.queryRunner,
                            manager: this.queryRunner.manager,
                            metadata,
                            removals,
                        });
                        if (executionResult instanceof Promise)
                            result.promises.push(executionResult);
                        result.count++;
                    }
                });
            }
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
    broadcastLoadEventsForAll(result: BroadcasterResult, metadata: EntityMetadata, entities: ObjectLiteral[]): void {
        // Check if there are any subscribers to afterBulkLoad. If there aren't, we don't need to keep the entitiesByMetadata cache
        const subscribersWithBulkLoad = this.queryRunner.connection.subscribers.filter(subscriber => !!subscriber.afterBulkLoad);
        const entitiesByMetadata: EntitiesByMetadata | undefined = subscribersWithBulkLoad.length ? {} : undefined;

        this.broadcastLoadEventsForAllInternal(result, metadata, entities, entitiesByMetadata);

        if (entitiesByMetadata) {
            const targets = Object.keys(entitiesByMetadata);
            for (const target of targets) {
                const {
                    metadata,
                    entities,
                } = entitiesByMetadata[target];

                subscribersWithBulkLoad.forEach(subscriber => {
                    if (this.isAllowedSubscriber(subscriber, metadata.target)) {
                        const executionResult = subscriber.afterBulkLoad!({
                            connection: this.queryRunner.connection,
                            queryRunner: this.queryRunner,
                            manager: this.queryRunner.manager,
                            entities,
                        });
                        if (executionResult instanceof Promise)
                            result.promises.push(executionResult);
                        result.count++;
                    }
                });
            }
        }
    }

    private broadcastLoadEventsForAllInternal(result: BroadcasterResult, metadata: EntityMetadata, entities: ObjectLiteral[], entitiesByMetadata?: EntitiesByMetadata): void {

        if (entitiesByMetadata) {
            const target = metadata.targetName;
            if (!entitiesByMetadata[target]) {
                entitiesByMetadata[target] = {
                    metadata: metadata,
                    entities,
                };
            } else {
                entitiesByMetadata[target].entities = entitiesByMetadata[target].entities.concat(entities);
            }
        }

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
                        this.broadcastLoadEventsForAllInternal(result, relation.inverseEntityMetadata, value instanceof Array ? value : [value], entitiesByMetadata);
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
                        const executionResult = subscriber.afterLoad!(entity);
                        if (executionResult instanceof Promise)
                            result.promises.push(executionResult);
                        result.count++;
                    }
                });
            }
        });
    }

    private addEntityToMetadataMap<T extends BroadcasterSubject>(subjectsByMetadata: SubjectsByMetadata<T> | undefined, subject: T) {
        if (subjectsByMetadata) {
            const target = subject.metadata.targetName;
            if (!subjectsByMetadata[target]) {
                subjectsByMetadata[target] = {
                    metadata: subject.metadata,
                    subjects: [subject],
                };
            } else {
                subjectsByMetadata[target].subjects.push(subject);
            }
        }
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
