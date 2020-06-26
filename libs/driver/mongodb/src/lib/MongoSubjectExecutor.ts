import {
    ObjectLiteral,
    OrmUtils,
    PromiseUtils,
    Subject,
    SubjectExecutor,
    SubjectWithoutIdentifierError
} from '@typeorm/core';
import { MongoEntityManager } from './MongoEntityManager';

export class MongoSubjectExecutor extends SubjectExecutor {

    /**
     * Executes insert operations.
     */
    protected async executeInsertOperations(): Promise<void> {
        // group insertion subjects to make bulk insertions
        const [groupedInsertSubjects, groupedInsertSubjectKeys] = this.groupBulkSubjects(this.insertSubjects, "insert");

        // then we run insertion in the sequential order which is important since we have an ordered subjects
        await PromiseUtils.runInSequence(groupedInsertSubjectKeys, async groupName => {
            const subjects = groupedInsertSubjects[groupName];

            // we must separately insert entities which does not have any values to insert
            // because its not possible to insert multiple entities with only default values in bulk
            const bulkInsertMaps: ObjectLiteral[] = [];
            const bulkInsertSubjects: Subject[] = [];
            subjects.forEach(subject => {
                if (subject.metadata.createDateColumn && subject.entity) {
                    subject.entity[subject.metadata.createDateColumn.databaseName] = new Date();
                }

                if (subject.metadata.updateDateColumn && subject.entity) {
                    subject.entity[subject.metadata.updateDateColumn.databaseName] = new Date();
                }

                subject.createValueSetAndPopChangeMap();

                bulkInsertSubjects.push(subject);
                bulkInsertMaps.push(subject.entity!);
            });

            // for mongodb we have a bit different insertion logic
            const manager = this.queryRunner.manager;
            const insertResult = await manager.insert(subjects[0].metadata.target, bulkInsertMaps);
            subjects.forEach((subject, index) => {
                subject.identifier = insertResult.identifiers[index];
                subject.generatedMap = insertResult.generatedMaps[index];
                subject.insertedValueSet = bulkInsertMaps[index];
            });


            subjects.forEach(subject => {
                if (subject.generatedMap) {
                    subject.metadata.columns.forEach(column => {
                        const value = column.getEntityValue(subject.generatedMap!);
                        if (value !== undefined && value !== null) {
                            const preparedValue = this.queryRunner.connection.driver.prepareHydratedValue(value, column);
                            column.setEntityValue(subject.generatedMap!, preparedValue);
                        }
                    });
                }
            });
        });
    }

    /**
     * Updates all given subjects in the database.
     */
    protected async executeUpdateOperations(): Promise<void> {
        await Promise.all(this.updateSubjects.map(async subject => {
            if (!subject.identifier)
                throw new SubjectWithoutIdentifierError(subject);

            const partialEntity = OrmUtils.mergeDeep({}, subject.entity!);
            if (subject.metadata.objectIdColumn && subject.metadata.objectIdColumn.propertyName) {
                delete partialEntity[subject.metadata.objectIdColumn.propertyName];
            }

            if (subject.metadata.createDateColumn && subject.metadata.createDateColumn.propertyName) {
                delete partialEntity[subject.metadata.createDateColumn.propertyName];
            }

            if (subject.metadata.updateDateColumn && subject.metadata.updateDateColumn.propertyName) {
                partialEntity[subject.metadata.updateDateColumn.propertyName] = new Date();
            }

            const manager = this.queryRunner.manager as MongoEntityManager;

            await manager.update(subject.metadata.target, subject.identifier, partialEntity);
        }));
    }

    /**
     * Removes all given subjects from the database.
     *
     * todo: we need to apply topological sort here as well
     */
    protected async executeRemoveOperations(): Promise<void> {

        // group insertion subjects to make bulk insertions
        const [groupedRemoveSubjects, groupedRemoveSubjectKeys] = this.groupBulkSubjects(this.removeSubjects, "delete");

        await PromiseUtils.runInSequence(groupedRemoveSubjectKeys, async groupName => {
            const subjects = groupedRemoveSubjects[groupName];
            const deleteMaps = subjects.map(subject => {
                if (!subject.identifier)
                    throw new SubjectWithoutIdentifierError(subject);

                return subject.identifier;
            });

            // for mongodb we have a bit different updation logic
            const manager = this.queryRunner.manager as MongoEntityManager;
            await manager.delete(subjects[0].metadata.target, deleteMaps);
        });
    }

    /**
     * Soft-removes all given subjects in the database.
     */
    protected async executeSoftRemoveOperations(): Promise<void> {
        await Promise.all(this.softRemoveSubjects.map(async subject => {

            if (!subject.identifier)
                throw new SubjectWithoutIdentifierError(subject);

            // for mongodb we have a bit different updation logic
            const partialEntity = OrmUtils.mergeDeep({}, subject.entity!);
            if (subject.metadata.objectIdColumn && subject.metadata.objectIdColumn.propertyName) {
                delete partialEntity[subject.metadata.objectIdColumn.propertyName];
            }

            if (subject.metadata.createDateColumn && subject.metadata.createDateColumn.propertyName) {
                delete partialEntity[subject.metadata.createDateColumn.propertyName];
            }

            if (subject.metadata.updateDateColumn && subject.metadata.updateDateColumn.propertyName) {
                partialEntity[subject.metadata.updateDateColumn.propertyName] = new Date();
            }

            if (subject.metadata.deleteDateColumn && subject.metadata.deleteDateColumn.propertyName) {
                partialEntity[subject.metadata.deleteDateColumn.propertyName] = new Date();
            }

            const manager = this.queryRunner.manager as MongoEntityManager;

            await manager.update(subject.metadata.target, subject.identifier, partialEntity);
        }));
    }

    /**
     * Recovers all given subjects in the database.
     */
    protected async executeRecoverOperations(): Promise<void> {
        await Promise.all(this.recoverSubjects.map(async subject => {

            if (!subject.identifier)
                throw new SubjectWithoutIdentifierError(subject);

            // for mongodb we have a bit different updation logic
            const partialEntity = OrmUtils.mergeDeep({}, subject.entity!);
            if (subject.metadata.objectIdColumn && subject.metadata.objectIdColumn.propertyName) {
                delete partialEntity[subject.metadata.objectIdColumn.propertyName];
            }

            if (subject.metadata.createDateColumn && subject.metadata.createDateColumn.propertyName) {
                delete partialEntity[subject.metadata.createDateColumn.propertyName];
            }

            if (subject.metadata.updateDateColumn && subject.metadata.updateDateColumn.propertyName) {
                partialEntity[subject.metadata.updateDateColumn.propertyName] = new Date();
            }

            if (subject.metadata.deleteDateColumn && subject.metadata.deleteDateColumn.propertyName) {
                partialEntity[subject.metadata.deleteDateColumn.propertyName] = null;
            }

            const manager = this.queryRunner.manager as MongoEntityManager;

            await manager.update(subject.metadata.target, subject.identifier, partialEntity);

        }));
    }

    /**
     * Updates all special columns of the saving entities (create date, update date, version, etc.).
     * Also updates nullable columns and columns with default values.
     */
    protected updateSpecialColumnsInPersistedEntities(): void {

        // update inserted entity properties
        if (this.insertSubjects.length)
            this.updateSpecialColumnsInInsertedAndUpdatedEntities(this.insertSubjects);

        // update updated entity properties
        if (this.updateSubjects.length)
            this.updateSpecialColumnsInInsertedAndUpdatedEntities(this.updateSubjects);

        // update soft-removed entity properties
        if (this.updateSubjects.length)
            this.updateSpecialColumnsInInsertedAndUpdatedEntities(this.softRemoveSubjects);

        // update recovered entity properties
        if (this.updateSubjects.length)
            this.updateSpecialColumnsInInsertedAndUpdatedEntities(this.recoverSubjects);

        // remove ids from the entities that were removed
        if (this.removeSubjects.length) {
            this.removeSubjects.forEach(subject => {
                if (!subject.entity) return;

                subject.metadata.primaryColumns.forEach(primaryColumn => {
                    primaryColumn.setEntityValue(subject.entity!, undefined);
                });
            });
        }

        // other post-persist updations
        this.allSubjects.forEach(subject => {
            if (!subject.entity) return;

            subject.metadata.relationIds.forEach(relationId => {
                relationId.setValue(subject.entity!);
            });

            // mongo _id remove
            if (subject.metadata.objectIdColumn
                && subject.metadata.objectIdColumn.databaseName
                && subject.metadata.objectIdColumn.databaseName !== subject.metadata.objectIdColumn.propertyName
            ) {
                delete subject.entity[subject.metadata.objectIdColumn.databaseName];
            }
        });
    }

}
