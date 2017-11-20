import {QueryRunner} from "../query-runner/QueryRunner";
import {Subject} from "./Subject";
import {PromiseUtils} from "../util/PromiseUtils";
import {SubjectTopoligicalSorter} from "./SubjectTopoligicalSorter";
import {SubjectChangedColumnsComputer} from "./SubjectChangedColumnsComputer";
import {SubjectWithoutIdentifierError} from "../error/SubjectWithoutIdentifierError";
import {SubjectRemovedAndUpdatedError} from "../error/SubjectRemovedAndUpdatedError";
import {MongoQueryRunner} from "../driver/mongodb/MongoQueryRunner";
import {MongoEntityManager} from "../entity-manager/MongoEntityManager";
import {InsertResult} from "../query-builder/result/InsertResult";
import {MongoDriver} from "../driver/mongodb/MongoDriver";
import {ObjectLiteral} from "../common/ObjectLiteral";

/**
 * Executes all database operations (inserts, updated, deletes) that must be executed
 * with given persistence subjects.
 */
export class SubjectExecutor {

    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * Indicates if executor has any operations to execute (e.g. has insert / update / delete operations to be executed).
     */
    hasExecutableOperations: boolean = false;

    // -------------------------------------------------------------------------
    // Protected Properties
    // -------------------------------------------------------------------------

    /**
     * QueryRunner used to execute all queries with a given subjects.
     */
    protected queryRunner: QueryRunner;

    /**
     * All subjects that needs to be operated.
     */
    protected allSubjects: Subject[];

    /**
     * Subjects that must be inserted.
     */
    protected insertSubjects: Subject[] = [];

    /**
     * Subjects that must be updated.
     */
    protected updateSubjects: Subject[] = [];

    /**
     * Subjects that must be removed.
     */
    protected removeSubjects: Subject[] = [];

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(queryRunner: QueryRunner, subjects: Subject[]) {
        this.queryRunner = queryRunner;
        this.allSubjects = subjects;
        this.validate();
        this.recompute();
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Executes all operations over given array of subjects.
     * Executes queries using given query runner.
     */
    async execute(): Promise<void> {

        // console.time("execution");
        // console.time("prepare");

        // broadcast "before" events before we start insert / update / remove operations
        await this.broadcastBeforeEventsForAll();

        // since event listeners and subscribers can call save methods and/or trigger entity changes we need to recompute operational subjects
        this.recompute();

        // make sure our insert subjects are sorted (using topological sorting) to make cascade inserts work properly
        this.insertSubjects = new SubjectTopoligicalSorter(this.insertSubjects).sort("insert");

        // console.timeEnd("prepare");

        // execute all insert operations
        // console.time("insertion");
        await this.executeInsertOperations();
        // console.timeEnd("insertion");

        // recompute update operations since insertion can create updation operations for the
        // properties it wasn't able to handle on its own (referenced columns)
        this.updateSubjects = this.allSubjects.filter(subject => subject.mustBeUpdated);

        // execute update operations
        // console.time("updation");
        await this.executeUpdateOperations();
        // console.timeEnd("updation");

        // make sure our remove subjects are sorted (using topological sorting) when multiple entities are passed for the removal
        // console.time("removal");
        this.removeSubjects = new SubjectTopoligicalSorter(this.removeSubjects).sort("delete");
        await this.executeRemoveOperations();
        // console.timeEnd("removal");

        // update all special columns in persisted entities, like inserted id or remove ids from the removed entities
        await this.updateSpecialColumnsInPersistedEntities();

        // finally broadcast "after" events after we finish insert / update / remove operations
        await this.broadcastAfterEventsForAll();
        // console.timeEnd("execution");
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Validates all given subjects.
     */
    protected validate() {
        this.allSubjects.forEach(subject => {
            if (subject.mustBeUpdated && subject.mustBeRemoved)
                throw new SubjectRemovedAndUpdatedError(subject);
        });
    }

    /**
     * Performs entity re-computations - finds changed columns, re-builds insert/update/remove subjects.
     */
    protected recompute(): void {
        new SubjectChangedColumnsComputer().compute(this.allSubjects);
        this.insertSubjects = this.allSubjects.filter(subject => subject.mustBeInserted);
        this.updateSubjects = this.allSubjects.filter(subject => subject.mustBeUpdated);
        this.removeSubjects = this.allSubjects.filter(subject => subject.mustBeRemoved);
        this.hasExecutableOperations = this.insertSubjects.length > 0 || this.updateSubjects.length > 0 || this.removeSubjects.length > 0;
    }

    /**
     * Broadcasts "BEFORE_INSERT", "BEFORE_UPDATE", "BEFORE_REMOVE" events for all given subjects.
     */
    protected async broadcastBeforeEventsForAll(): Promise<void> {
        await Promise.all([
            ...this.insertSubjects.map(subject => this.queryRunner.broadcaster.broadcastBeforeInsertEvent(subject.metadata, subject.entity!)),
            ...this.updateSubjects.map(subject => this.queryRunner.broadcaster.broadcastBeforeUpdateEvent(subject.metadata, subject.entity!, subject.databaseEntity)),
            ...this.removeSubjects.map(subject => this.queryRunner.broadcaster.broadcastBeforeRemoveEvent(subject.metadata, subject.entity!, subject.databaseEntity))
        ]);
    }

    /**
     * Broadcasts "AFTER_INSERT", "AFTER_UPDATE", "AFTER_REMOVE" events for all given subjects.
     */
    protected async broadcastAfterEventsForAll(): Promise<void> {
        await Promise.all([
            ...this.insertSubjects.map(subject => this.queryRunner.broadcaster.broadcastAfterInsertEvent(subject.metadata, subject.entity!)),
            ...this.updateSubjects.map(subject => this.queryRunner.broadcaster.broadcastAfterUpdateEvent(subject.metadata, subject.entity!, subject.databaseEntity)),
            ...this.removeSubjects.map(subject => this.queryRunner.broadcaster.broadcastAfterRemoveEvent(subject.metadata, subject.entity!, subject.databaseEntity))
        ]);
    }

    /**
     * Executes insert operations.
     */
    protected async executeInsertOperations(): Promise<void> {

        // group insertion subjects to make bulk insertions
        const groupedInsertSubjects = this.groupBulkSubjects(this.insertSubjects, "insert");

        // then we run insertion in the sequential order which is important since we have an ordered subjects
        await PromiseUtils.runInSequence(Object.keys(groupedInsertSubjects), async groupName => {
            const subjects = groupedInsertSubjects[groupName];
            const insertMaps = subjects.map(subject => {
                if (this.queryRunner.connection.driver instanceof MongoDriver) {
                    return subject.entity;
                } else {
                    return subject.createValueSetAndPopChangeMap();
                }
            });
            let insertResult: InsertResult;

            // for mongodb we have a bit different insertion logic
            if (this.queryRunner instanceof MongoQueryRunner) {

                const manager = this.queryRunner.manager as MongoEntityManager;
                insertResult = await manager.insert(subjects[0].metadata.target, insertMaps);

            } else {

                // here we execute our insertion query
                // we need to enable entity updation because we DO need to have updated insertedMap
                // which is not same object as our entity that's why we don't need to worry about our entity to get dirty
                // also, we disable listeners because we call them on our own in persistence layer
                insertResult = await this.queryRunner
                    .manager
                    .createQueryBuilder()
                    .insert()
                    .into(subjects[0].metadata.target)
                    .values(insertMaps)
                    .updateEntity(true)
                    .callListeners(false)
                    .execute();
            }

            subjects.forEach((subject, index) => {
                subject.identifier = insertResult.identifiers[index];
                subject.generatedMap = insertResult.generatedMaps[index];
                subject.insertedValueSet = insertMaps[index];
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

            const updateMap: ObjectLiteral = this.queryRunner.connection.driver instanceof MongoDriver ? subject.entity! : subject.createValueSetAndPopChangeMap();

            // for mongodb we have a bit different updation logic
            if (this.queryRunner instanceof MongoQueryRunner) {
                const manager = this.queryRunner.manager as MongoEntityManager;
                await manager.update(subject.metadata.target, subject.identifier, updateMap);

            } else {

                // here we execute our updation query
                // we need to enable entity updation because we update a subject identifier
                // which is not same object as our entity that's why we don't need to worry about our entity to get dirty
                // also, we disable listeners because we call them on our own in persistence layer
                const updateQueryBuilder = this.queryRunner
                    .manager
                    .createQueryBuilder()
                    .update(subject.metadata.target)
                    .set(updateMap)
                    .updateEntity(true)
                    .callListeners(false);

                if (subject.entity) {
                    updateQueryBuilder.whereEntity(subject.identifier);

                } else { // in this case identifier is just conditions object to update by
                    updateQueryBuilder.where(subject.identifier);
                }

                const updateResult = await updateQueryBuilder.execute();
                subject.generatedMap = updateResult.generatedMaps[0];
            }
        }));
    }

    /**
     * Removes all given subjects from the database.
     *
     * todo: we need to apply topological sort here as well
     */
    protected async executeRemoveOperations(): Promise<void> {
        // group insertion subjects to make bulk insertions
        const groupedRemoveSubjects = this.groupBulkSubjects(this.removeSubjects, "delete");

        await PromiseUtils.runInSequence(Object.keys(groupedRemoveSubjects), async groupName => {
            const subjects = groupedRemoveSubjects[groupName];
            const deleteMaps = subjects.map(subject => {
                if (!subject.identifier)
                    throw new SubjectWithoutIdentifierError(subject);

                return subject.identifier;
            });

            // for mongodb we have a bit different updation logic
            if (this.queryRunner instanceof MongoQueryRunner) {
                const manager = this.queryRunner.manager as MongoEntityManager;
                await manager.delete(subjects[0].metadata.target, deleteMaps);

            } else {

                // here we execute our deletion query
                // we don't need to specify entities and set update entity to true since the only thing query builder
                // will do for use is a primary keys deletion which is handled by us later once persistence is finished
                // also, we disable listeners because we call them on our own in persistence layer
                await this.queryRunner
                    .manager
                    .createQueryBuilder()
                    .delete()
                    .from(subjects[0].metadata.target)
                    .where(deleteMaps)
                    .callListeners(false)
                    .execute();
            }
        });
    }

    /**
     * Updates all special columns of the saving entities (create date, update date, version, etc.).
     * Also updates nullable columns and columns with default values.
     */
    protected updateSpecialColumnsInPersistedEntities(): void {

        // update inserted and updated entity properties
        [...this.insertSubjects, ...this.updateSubjects].forEach(subject => {
            if (!subject.entity) return;

            // set values to "null" for nullable columns that did not have values
            subject.metadata.columns.forEach(column => {
                if (!column.isNullable || column.isVirtual)
                    return;

                const columnValue = column.getEntityValue(subject.entity!);
                if (columnValue === undefined)
                    column.setEntityValue(subject.entity!, null);
            });

            // merge into entity all generated values returned by a database
            if (subject.generatedMap)
                this.queryRunner.manager.merge(subject.metadata.target, subject.entity, subject.generatedMap);
        });

        // remove ids from the entities that were removed
        this.removeSubjects.forEach(subject => {
            if (!subject.entity) return;

            subject.metadata.primaryColumns.forEach(primaryColumn => {
                primaryColumn.setEntityValue(subject.entity!, undefined);
            });
        });

        // other post-persist updations
        this.allSubjects.forEach(subject => {
            if (!subject.entity) return;

            subject.metadata.relationIds.forEach(relationId => {
                relationId.setValue(subject.entity!);
            });
        });
    }

    /**
     * Groups subjects by metadata names (by tables) to make bulk insertions and deletions possible.
     * However there are some limitations with bulk insertions of data into tables with generated (increment) columns
     * in some drivers. Some drivers like mysql and sqlite does not support returning multiple generated columns
     * after insertion and can only return a single generated column value, that's why its not possible to do bulk insertion,
     * because it breaks insertion result's generatedMap and leads to problems when this subject is used in other subjects saves.
     * That's why we only support bulking in junction tables for those drivers.
     *
     * Other drivers like postgres and sql server support RETURNING / OUTPUT statement which allows to return generated
     * id for each inserted row, that's why bulk insertion is not limited to junction tables in there.
     */
    protected groupBulkSubjects(subjects: Subject[], type: "insert"|"delete"): { [key: string]: Subject[] } {
        return subjects.reduce((group, subject, index) => {

            const key = type === "delete" || this.queryRunner.connection.driver.isReturningSqlSupported() || subject.metadata.isJunction
                ? subject.metadata.name
                : subject.metadata.name + "_" + index;

            if (!group[key])
                group[key] = [];

            group[key].push(subject);
            return group;
        }, {} as { [key: string]: Subject[] });
    }

}
