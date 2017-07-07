import {ObjectLiteral} from "../common/ObjectLiteral";
import {EntityMetadata} from "../metadata/EntityMetadata";
import {ColumnMetadata} from "../metadata/ColumnMetadata";
import {RelationMetadata} from "../metadata/RelationMetadata";
import {DateUtils} from "../util/DateUtils";

/**
 * Holds information about insert operation into junction table.
 */
export interface JunctionInsert {

    /**
     * Relation of the junction table.
     */
    relation: RelationMetadata;

    /**
     * Entities that needs to be "bind" to the subject.
     */
    junctionEntities: ObjectLiteral[];
}

/**
 * Holds information about remove operation from the junction table.
 */
export interface JunctionRemove {

    /**
     * Relation of the junction table.
     */
    relation: RelationMetadata;

    /**
     * Entity ids that needs to be removed from the junction table.
     */
    junctionRelationIds: any[];
}

/**
 * Holds information about relation update in some subject.
 */
export interface RelationUpdate {

    /**
     * Relation that needs to be updated.
     */
    relation: RelationMetadata;

    /**
     * New value that needs to be set into into new relation.
     */
    value: any;
}

/**
 * Subject is a subject of persistence.
 * It holds information about each entity that needs to be persisted:
 * - what entity should be persisted
 * - what is database representation of the persisted entity
 * - what entity metadata of the persisted entity
 * - what is allowed to with persisted entity (insert/update/remove)
 *
 * Having this collection of subjects we can perform database queries.
 */
export class Subject {

    // -------------------------------------------------------------------------
    // Private Properties
    // -------------------------------------------------------------------------

    /**
     * Persist entity (changed entity).
     */
    private _persistEntity?: ObjectLiteral;

    /**
     * Database entity.
     */
    private _databaseEntity?: ObjectLiteral;

    // -------------------------------------------------------------------------
    // Public Readonly Properties
    // -------------------------------------------------------------------------

    /**
     * Entity metadata of the subject entity.
     */
    readonly metadata: EntityMetadata;

    /**
     * Date when this entity is persisted.
     */
    readonly date: Date = new Date();

    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * Indicates if this subject can be inserted into the database.
     * This means that this subject either is newly persisted, either can be inserted by cascades.
     */
    canBeInserted: boolean = false;

    /**
     * Indicates if this subject can be updated in the database.
     * This means that this subject either was persisted, either can be updated by cascades.
     */
    canBeUpdated: boolean = false;

    /**
     * Indicates if this subject MUST be removed from the database.
     * This means that this subject either was removed, either was removed by cascades.
     */
    mustBeRemoved: boolean = false;

    /**
     * Differentiated columns between persisted and database entities.
     */
    diffColumns: ColumnMetadata[] = [];

    /**
     * Differentiated relations between persisted and database entities.
     */
    diffRelations: RelationMetadata[] = [];

    /**
     * List of relations which need to be unset.
     * This is used to update relation from inverse side.
     */
    relationUpdates: RelationUpdate[] = [];

    /**
     * Records that needs to be inserted into the junction tables of this subject.
     */
    junctionInserts: JunctionInsert[] = [];

    /**
     * Records that needs to be removed from the junction tables of this subject.
     */
    junctionRemoves: JunctionRemove[] = [];

    /**
     * When subject is newly persisted it may have a generated entity id.
     * In this case it should be written here.
     */
    newlyGeneratedId?: any;

    /**
     * When subject is newly persisted it may have a generated object id.
     * This value will be stored here. This is actual only for mongodb database.
     */
    generatedObjectId?: any;

    /**
     * Generated id of the parent entity. Used in the class-table-inheritance.
     */
    parentGeneratedId?: any;

    /**
     * Used in newly persisted entities which are tree tables.
     */
    treeLevel?: number;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(metadata: EntityMetadata, entity?: ObjectLiteral, databaseEntity?: ObjectLiteral) {
        this.metadata = metadata;
        this._persistEntity = entity;
        this._databaseEntity = databaseEntity;
    }

    // -------------------------------------------------------------------------
    // Accessors
    // -------------------------------------------------------------------------

    /**
     * Gets entity sent to the persistence (e.g. changed entity).
     * Throws error if persisted entity was not set.
     */
    get entity(): ObjectLiteral {
        if (!this._persistEntity)
            throw new Error(`Persistence entity is not set for the given subject.`);

        return this._persistEntity;
    }

    /**
     * Checks if subject has a persisted entity.
     */
    get hasEntity(): boolean {
        return !!this._persistEntity;
    }

    /**
     * Gets entity from the database (e.g. original entity).
     * THIS IS NOT RAW ENTITY DATA.
     * Throws error if database entity was not set.
     */
    get databaseEntity(): ObjectLiteral {
        if (!this._databaseEntity)
            throw new Error(`Database entity is not set for the given subject.`);

        return this._databaseEntity;
    }

    /**
     * Checks if subject has a database entity.
     */
    get hasDatabaseEntity(): boolean {
        return !!this._databaseEntity;
    }

    /**
     * Sets entity from the database (e.g. original entity).
     * Once database entity set it calculates differentiated columns and relations
     * between persistent entity and database entity.
     */
    set databaseEntity(databaseEntity: ObjectLiteral) {
        this._databaseEntity = databaseEntity;
        this.recompute();
    }

    /**
     * Gets entity target from the entity metadata of this subject.
     */
    get entityTarget(): Function|string {
        return this.metadata.target;
    }

    /**
     * Checks if this subject must be inserted into the database.
     * Subject can be inserted into the database if it is allowed to be inserted (explicitly persisted or by cascades)
     * and if it does not have database entity set.
     */
    get mustBeInserted() {
        return this.canBeInserted && !this.hasDatabaseEntity;
    }

    /**
     * Checks if this subject must be updated into the database.
     * Subject can be updated in the database if it is allowed to be updated (explicitly persisted or by cascades)
     * and if it does have differentiated columns or relations.
     */
    get mustBeUpdated() {
        return this.canBeUpdated && (this.diffColumns.length > 0 || this.diffRelations.length > 0);
    }

    /**
     * Checks if this subject has relations to be updated.
     */
    get hasRelationUpdates(): boolean {
        return this.relationUpdates.length > 0;
    }

    /**
     * Gets id of the persisted entity.
     * If entity is not set then it returns undefined.
     * If entity itself has an id then it simply returns it.
     * If entity does not have an id then it returns newly generated id.

    get getPersistedEntityIdMap(): any|undefined {
        if (!this.hasEntity)
            return undefined;

        const entityIdMap = this.metadata.getDatabaseEntityIdMap(this.entity);
        if (entityIdMap)
            return entityIdMap;

        if (this.newlyGeneratedId)
            return this.metadata.createSimpleDatabaseIdMap(this.newlyGeneratedId);

        return undefined;
    }*/

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Validates this subject for errors.
     * Subject cannot be at the same time inserted and updated, removed and inserted, removed and updated.
     */
    validate() {

        if (this.mustBeInserted && this.mustBeRemoved)
            throw new Error(`Removed entity ${this.metadata.name} is also scheduled for insert operation. This looks like ORM problem. Please report a github issue.`);

        if (this.mustBeUpdated && this.mustBeRemoved)
            throw new Error(`Removed entity "${this.metadata.name}" is also scheduled for update operation. ` +
                `Make sure you are not updating and removing same object (note that update or remove may be executed by cascade operations).`);

        if (this.mustBeInserted && this.mustBeUpdated)
            throw new Error(`Inserted entity ${this.metadata.name} is also scheduled for updated operation. This looks like ORM problem. Please report a github issue.`);

    }

    /**
     * Performs entity re-computations.
     */
    recompute() {
        if (this.hasEntity && this._databaseEntity) {
            this.computeDiffColumns();
            this.computeDiffRelationalColumns();
        }
    }

    // -------------------------------------------------------------------------
    // Protected Methods
    // -------------------------------------------------------------------------

    /**
     * Differentiate columns from the updated entity and entity stored in the database.
     */
    protected computeDiffColumns(): void {
        this.diffColumns = this.metadata.columns.filter(column => {

            // prepare both entity and database values to make comparision
            let entityValue = column.getEntityValue(this.entity);
            let databaseValue = column.getEntityValue(this.databaseEntity);
            if (entityValue === undefined)
                return false;

            // normalize special values to make proper comparision (todo: arent they already normalized at this point?!)
            if (entityValue !== null && entityValue !== undefined) {
                if (column.type === "date") {
                    entityValue = DateUtils.mixedDateToDateString(entityValue);

                } else if (column.type === "time") {
                    entityValue = DateUtils.mixedDateToTimeString(entityValue);

                } else if (column.type === "datetime" || column.type === Date) {
                    entityValue = DateUtils.mixedDateToUtcDatetimeString(entityValue);
                    databaseValue = DateUtils.mixedDateToUtcDatetimeString(databaseValue);

                } else if (column.type === "json" || column.type === "jsonb" || column.type === Object) {
                    entityValue = JSON.stringify(entityValue);
                    if (databaseValue !== null && databaseValue !== undefined)
                        databaseValue = JSON.stringify(databaseValue);

                } else if (column.type === "sample-array") {
                    entityValue = DateUtils.simpleArrayToString(entityValue);
                    databaseValue = DateUtils.simpleArrayToString(databaseValue);
                }
            }
            // todo: this mechanism does not get in count embeddeds in embeddeds

            // if value is not defined then no need to update it
            // if (!column.isInEmbedded && this.entity[column.propertyName] === undefined)
            //     return false;
            //
            // if value is in embedded and is not defined then no need to update it
            // if (column.isInEmbedded && (this.entity[column.embeddedProperty] === undefined || this.entity[column.embeddedProperty][column.propertyName] === undefined))
            //     return false;

            // if its a special column or value is not changed - then do nothing
            if (column.isVirtual ||
                column.isParentId ||
                column.isDiscriminator ||
                column.isUpdateDate ||
                column.isVersion ||
                column.isCreateDate ||
                entityValue === databaseValue)
                return false;

            // filter out "relational columns" only in the case if there is a relation object in entity
            const relation = this.metadata.findRelationWithDbName(column.databaseName);
            if (relation) {
                const value = relation.getEntityValue(this.entity);
                if (value !== null && value !== undefined)
                    return false;
            }

            return true;
        });
    }

    /**
     * Difference columns of the owning one-to-one and many-to-one columns.
     */
    protected computeDiffRelationalColumns(/*todo: updatesByRelations: UpdateByRelationOperation[], */): void {
        this.diffRelations = this.metadata.relations.filter(relation => {
            if (!relation.isManyToOne && !(relation.isOneToOne && relation.isOwning))
                return false;

            // here we cover two scenarios:
            // 1. related entity can be another entity which is natural way
            // 2. related entity can be entity id which is hacked way of updating entity
            // todo: what to do if there is a column with relationId? (cover this too?)
            const entityValue = relation.getEntityValue(this.entity);
            const updatedEntityRelationId: any = entityValue instanceof Object
                    ? relation.inverseEntityMetadata.getEntityIdMixedMap(entityValue)
                    : entityValue;

            const dbEntityRelationId = relation.getEntityValue(this.databaseEntity);

            // todo: try to find if there is update by relation operation - we dont need to generate update relation operation for this
            // todo: if (updatesByRelations.find(operation => operation.targetEntity === this && operation.updatedRelation === relation))
            // todo:     return false;

            // we don't perform operation over undefined properties
            if (updatedEntityRelationId === undefined)
                return false;

            // if both are empty totally no need to do anything
            if ((updatedEntityRelationId === undefined || updatedEntityRelationId === null) &&
                (dbEntityRelationId === undefined || dbEntityRelationId === null))
                return false;

            // if relation ids aren't equal then we need to update them
            return updatedEntityRelationId !== dbEntityRelationId;
        });
    }

}