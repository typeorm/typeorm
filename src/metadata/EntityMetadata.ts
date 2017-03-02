import {TableMetadata} from "./TableMetadata";
import {ColumnMetadata} from "./ColumnMetadata";
import {RelationMetadata, PropertyTypeInFunction} from "./RelationMetadata";
import {IndexMetadata} from "./IndexMetadata";
import {RelationTypes} from "./types/RelationTypes";
import {ForeignKeyMetadata} from "./ForeignKeyMetadata";
import {NamingStrategyInterface} from "../naming-strategy/NamingStrategyInterface";
import {EntityMetadataArgs} from "../metadata-args/EntityMetadataArgs";
import {EmbeddedMetadata} from "./EmbeddedMetadata";
import {ObjectLiteral} from "../common/ObjectLiteral";
import {LazyRelationsWrapper} from "../lazy-loading/LazyRelationsWrapper";

// todo: IDEA. store all entity metadata in the EntityMetadata too? (this will open more features for metadata objects + no need to access connection in lot of places)

/**
 * Contains all entity metadata.
 */
export class EntityMetadata {

    // -------------------------------------------------------------------------
    // Properties
    // -------------------------------------------------------------------------

    /**
     * If entity's table is a closure-typed table, then this entity will have a closure junction table metadata.
     */
    closureJunctionTable: EntityMetadata;

    /**
     * Parent's entity metadata. Used in inheritance patterns.
     */
    parentEntityMetadata: EntityMetadata;

    // -------------------------------------------------------------------------
    // Public Readonly Properties
    // -------------------------------------------------------------------------

    /**
     * Naming strategy used to generate and normalize names.
     */
    readonly namingStrategy: NamingStrategyInterface;

    /**
     * Target class to which this entity metadata is bind.
     * Note, that when using table inheritance patterns target can be different rather then table's target.
     */
    readonly target: Function|string;

    /**
     * Indicates if this entity metadata of a junction table, or not.
     */
    readonly junction: boolean;

    /**
     * Entity's table metadata.
     */
    readonly table: TableMetadata;

    /**
     * Entity's relation metadatas.
     */
    readonly relations: RelationMetadata[];

    /**
     * Entity's index metadatas.
     */
    readonly indices: IndexMetadata[];

    /**
     * Entity's foreign key metadatas.
     */
    readonly foreignKeys: ForeignKeyMetadata[] = [];

    /**
     * Entity's embedded metadatas.
     */
    readonly embeddeds: EmbeddedMetadata[];

    /**
     * If this entity metadata's table using one of the inheritance patterns,
     * then this will contain what pattern it uses.
     */
    readonly inheritanceType?: "single-table"|"class-table";

    /**
     * If this entity metadata is a child table of some table, it should have a discriminator value.
     * Used to store a value in a discriminator column.
     */
    readonly discriminatorValue?: string;

    /**
     * Global tables prefix. Customer can set a global table prefix for all tables in the database.
     */
    readonly tablesPrefix?: string;

    // -------------------------------------------------------------------------
    // Private properties
    // -------------------------------------------------------------------------

    /**
     * Entity's column metadatas.
     */
    private readonly _columns: ColumnMetadata[];

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(args: EntityMetadataArgs,
                private lazyRelationsWrapper: LazyRelationsWrapper) {
        this.target = args.target;
        this.junction = args.junction;
        this.tablesPrefix = args.tablesPrefix;
        this.namingStrategy = args.namingStrategy;
        this.table = args.tableMetadata;
        this._columns = args.columnMetadatas || [];
        this.relations = args.relationMetadatas || [];
        this.indices = args.indexMetadatas || [];
        this.foreignKeys = args.foreignKeyMetadatas || [];
        this.embeddeds = args.embeddedMetadatas || [];
        this.discriminatorValue = args.discriminatorValue;
        this.inheritanceType = args.inheritanceType;

        this.table.entityMetadata = this;
        this._columns.forEach(column => column.entityMetadata = this);
        this.relations.forEach(relation => relation.entityMetadata = this);
        this.foreignKeys.forEach(foreignKey => foreignKey.entityMetadata = this);
        this.indices.forEach(index => index.entityMetadata = this);

        const setEmbeddedEntityMetadataRecursively = (embeddeds: EmbeddedMetadata[]) => {
            embeddeds.forEach(embedded => {
                embedded.entityMetadata = this;
                embedded.columns.forEach(column => column.entityMetadata = this);
                setEmbeddedEntityMetadataRecursively(embedded.embeddeds);
            });
        };
        setEmbeddedEntityMetadataRecursively(this.embeddeds);
    }

    // -------------------------------------------------------------------------
    // Accessors
    // -------------------------------------------------------------------------

    /**
     * Entity's name. Equal to entity target class's name if target is set to table, or equals to table name if its set.
     */
    get name(): string {
        if (!this.table)
            throw new Error("No table target set to the entity metadata.");

        return this.targetName ? this.targetName : this.table.name;
    }

    /**
     * Columns of the entity, including columns that are coming from the embeddeds of this entity.
     * @deprecated
     */
    get columns(): ColumnMetadata[] {
        let allColumns: ColumnMetadata[] = ([] as ColumnMetadata[]).concat(this._columns);
        this.embeddeds.forEach(embedded => {
            allColumns = allColumns.concat(embedded.columns);
        });
        return allColumns;
    }

    /**
     * Gets columns without embedded columns.
     */
    get columnsWithoutEmbeddeds(): ColumnMetadata[] {
        return this._columns;
    }

    /**
     * All columns of the entity, including columns that are coming from the embeddeds of this entity,
     * and including columns from the parent entities.
     */
    get allColumns(): ColumnMetadata[] {
        let columns = this.columns;
        if (this.parentEntityMetadata)
            columns = columns.concat(this.parentEntityMetadata.columns);

        return columns;
    }

    /**
     * All relations of the entity, including relations from the parent entities.
     */
    get allRelations(): RelationMetadata[] {
        let relations = this.relations;
        if (this.parentEntityMetadata)
            relations = relations.concat(this.parentEntityMetadata.relations);

        return relations;
    }

    /**
     * Gets the name of the target.
     */
    get targetName(): string {
        if (typeof this.target === "string")
            return this.target;

        if (this.target instanceof Function)
            return (<any> this.target).name;

        return "";
    }

    /**
     * Checks if entity's table has multiple primary columns.
     */
    get hasMultiplePrimaryKeys() {
        return this.primaryColumns.length > 1;
    }

    /**
     * Gets the primary column.
     *
     * @deprecated
     */
    get primaryColumn(): ColumnMetadata {
        const primaryKey = this.primaryColumns[0];
        if (!primaryKey)
            throw new Error(`Primary key is not set for the ${this.name} entity.`);

        return primaryKey;
    }

    /**
     * Checks if table has generated column.
     */
    get hasGeneratedColumn(): boolean {
        return !!this.generatedColumnIfExist;
    }

    /**
     * Gets the column with generated flag.
     */
    get generatedColumn(): ColumnMetadata {
        const generatedColumn = this.generatedColumnIfExist;
        if (!generatedColumn)
            throw new Error(`Generated column was not found`);

        return generatedColumn;
    }

    /**
     * Gets the generated column if it exists, or returns undefined if it does not.
     */
    get generatedColumnIfExist(): ColumnMetadata|undefined {
        return this._columns.find(column => column.isGenerated);
    }

    /**
     * Gets first primary column. In the case if table contains multiple primary columns it
     * throws error.
     */
    get firstPrimaryColumn(): ColumnMetadata {
        if (this.hasMultiplePrimaryKeys)
            throw new Error(`Entity ${this.name} has multiple primary keys. This operation is not supported on entities with multiple primary keys`);

        return this.primaryColumns[0];
    }

    /**
     * Gets the primary columns.
     */
    get primaryColumns(): ColumnMetadata[] {
        // const originalPrimaryColumns = this._columns.filter(column => column.isPrimary);
        // const parentEntityPrimaryColumns = this.hasParentIdColumn ? [this.parentIdColumn] : [];
        // return originalPrimaryColumns.concat(parentEntityPrimaryColumns);
        return this._columns.filter(column => column.isPrimary);
        // const originalPrimaryColumns = this._columns.filter(column => column.isPrimary);
        // const parentEntityPrimaryColumns = this.parentEntityMetadata ? this.parentEntityMetadata.primaryColumns : [];
        // return originalPrimaryColumns.concat(parentEntityPrimaryColumns);
    }

    get primaryColumnsWithParentIdColumns(): ColumnMetadata[] {
        return this.primaryColumns.concat(this.parentIdColumns);
    }

    /**
     * Gets all primary columns including columns from the parent entities.
     */
    get allPrimaryColumns(): ColumnMetadata[] {
        return this.primaryColumns.concat(this.parentPrimaryColumns);
    }

    /**
     * Gets the primary columns of the parent entity metadata.
     * If parent entity metadata does not exist then it simply returns empty array.
     */
    get parentPrimaryColumns(): ColumnMetadata[] {
        if (this.parentEntityMetadata)
            return this.parentEntityMetadata.primaryColumns;

        return [];
    }

    /**
     * Gets only primary columns owned by this entity.
     */
    get ownPimaryColumns(): ColumnMetadata[] {
        return this._columns.filter(column => column.isPrimary);
    }

    /**
     * Checks if entity has a create date column.
     */
    get hasCreateDateColumn(): boolean {
        return !!this._columns.find(column => column.mode === "createDate");
    }

    /**
     * Gets entity column which contains a create date value.
     */
    get createDateColumn(): ColumnMetadata {
        const column = this._columns.find(column => column.mode === "createDate");
        if (!column)
            throw new Error(`CreateDateColumn was not found in entity ${this.name}`);

        return column;
    }

    /**
     * Checks if entity has an update date column.
     */
    get hasUpdateDateColumn(): boolean {
        return !!this._columns.find(column => column.mode === "updateDate");
    }

    /**
     * Gets entity column which contains an update date value.
     */
    get updateDateColumn(): ColumnMetadata {
        const column = this._columns.find(column => column.mode === "updateDate");
        if (!column)
            throw new Error(`UpdateDateColumn was not found in entity ${this.name}`);

        return column;
    }

    /**
     * Checks if entity has a version column.
     */
    get hasVersionColumn(): boolean {
        return !!this._columns.find(column => column.mode === "version");
    }

    /**
     * Gets entity column which contains an entity version.
     */
    get versionColumn(): ColumnMetadata {
        const column = this._columns.find(column => column.mode === "version");
        if (!column)
            throw new Error(`VersionColumn was not found in entity ${this.name}`);

        return column;
    }

    /**
     * Checks if entity has a discriminator column.
     */
    get hasDiscriminatorColumn(): boolean {
        return !!this._columns.find(column => column.mode === "discriminator");
    }

    /**
     * Gets the discriminator column used to store entity identificator in single-table inheritance tables.
     */
    get discriminatorColumn(): ColumnMetadata {
        const column = this._columns.find(column => column.mode === "discriminator");
        if (!column)
            throw new Error(`DiscriminatorColumn was not found in entity ${this.name}`);

        return column;
    }

    /**
     * Checks if entity has a tree level column.
     */
    get hasTreeLevelColumn(): boolean {
        return !!this._columns.find(column => column.mode === "treeLevel");
    }

    get treeLevelColumn(): ColumnMetadata {
        const column = this._columns.find(column => column.mode === "treeLevel");
        if (!column)
            throw new Error(`TreeLevelColumn was not found in entity ${this.name}`);

        return column;
    }

    /**
     * Checks if entity has a tree level column.
     */
    get hasParentIdColumn(): boolean {
        return !!this._columns.find(column => column.mode === "parentId");
    }

    get parentIdColumn(): ColumnMetadata {
        const column = this._columns.find(column => column.mode === "parentId");
        if (!column)
            throw new Error(`Parent id column was not found in entity ${this.name}`);

        return column;
    }

    get parentIdColumns(): ColumnMetadata[] {
        return this._columns.filter(column => column.mode === "parentId");
    }

    /**
     * Checks if entity has an object id column.
     */
    get hasObjectIdColumn(): boolean {
        return !!this._columns.find(column => column.mode === "objectId");
    }

    /**
     * Gets the object id column used with mongodb database.
     */
    get objectIdColumn(): ColumnMetadata {
        const column = this._columns.find(column => column.mode === "objectId");
        if (!column)
            throw new Error(`ObjectId was not found in entity ${this.name}`);

        return column;
    }

    /**
     * Gets single (values of which does not contain arrays) relations.
     */
    get singleValueRelations(): RelationMetadata[] {
        return this.relations.filter(relation => {
            return relation.relationType === RelationTypes.ONE_TO_ONE || relation.relationType === RelationTypes.ONE_TO_MANY;
        });
    }

    /**
     * Gets single (values of which does not contain arrays) relations.
     */
    get multiValueRelations(): RelationMetadata[] {
        return this.relations.filter(relation => {
            return relation.relationType === RelationTypes.ONE_TO_ONE || relation.relationType === RelationTypes.ONE_TO_MANY;
        });
    }

    /**
     * Gets only one-to-one relations of the entity.
     */
    get oneToOneRelations(): RelationMetadata[] {
        return this.relations.filter(relation => relation.relationType === RelationTypes.ONE_TO_ONE);
    }

    /**
     * Gets only owner one-to-one relations of the entity.
     */
    get ownerOneToOneRelations(): RelationMetadata[] {
        return this.relations.filter(relation => relation.relationType === RelationTypes.ONE_TO_ONE && relation.isOwning);
    }

    /**
     * Gets only one-to-many relations of the entity.
     */
    get oneToManyRelations(): RelationMetadata[] {
        return this.relations.filter(relation => relation.relationType === RelationTypes.ONE_TO_MANY);
    }

    /**
     * Gets only many-to-one relations of the entity.
     */
    get manyToOneRelations(): RelationMetadata[] {
        return this.relations.filter(relation => relation.relationType === RelationTypes.MANY_TO_ONE);
    }

    /**
     * Gets only many-to-many relations of the entity.
     */
    get manyToManyRelations(): RelationMetadata[] {
        return this.relations.filter(relation => relation.relationType === RelationTypes.MANY_TO_MANY);
    }

    /**
     * Gets only owner many-to-many relations of the entity.
     */
    get ownerManyToManyRelations(): RelationMetadata[] {
        return this.relations.filter(relation => relation.relationType === RelationTypes.MANY_TO_MANY && relation.isOwning);
    }

    /**
     * Gets only owner one-to-one and many-to-one relations.
     */
    get relationsWithJoinColumns() {
        return this.ownerOneToOneRelations.concat(this.manyToOneRelations);
    }

    /**
     * Checks if there is a tree parent relation. Used only in tree-tables.
     */
    get hasTreeParentRelation() {
        return !!this.relations.find(relation => relation.isTreeParent);
    }

    /**
     * Tree parent relation. Used only in tree-tables.
     */
    get treeParentRelation() {
        const relation = this.relations.find(relation => relation.isTreeParent);
        if (!relation)
            throw new Error(`TreeParent relation was not found in entity ${this.name}`);

        return relation;
    }

    /**
     * Checks if there is a tree children relation. Used only in tree-tables.
     */
    get hasTreeChildrenRelation() {
        return !!this.relations.find(relation => relation.isTreeChildren);
    }

    /**
     * Tree children relation. Used only in tree-tables.
     */
    get treeChildrenRelation() {
        const relation = this.relations.find(relation => relation.isTreeChildren);
        if (!relation)
            throw new Error(`TreeParent relation was not found in entity ${this.name}`);

        return relation;
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Creates a new entity.
     */
    create(): any {

        // if target is set to a function (e.g. class) that can be created then create it
        if (this.target instanceof Function)
            return new (<any> this.target)();

        // otherwise simply return a new empty object
        const newObject = {};
        this.relations
            .filter(relation => relation.isLazy)
            .forEach(relation => this.lazyRelationsWrapper.wrap(newObject, relation));

        return newObject;
    }

    /**
     * Creates an object - map of columns and relations of the entity.
     */
    createPropertiesMap(): { [name: string]: string|any } {
        const entity: { [name: string]: string|any } = {};
        this._columns.forEach(column => entity[column.propertyName] = column.propertyName);
        this.relations.forEach(relation => entity[relation.propertyName] = relation.propertyName);
        return entity;
    }

    /**
     * Computes property name of the entity using given PropertyTypeInFunction.
     */
    computePropertyName(nameOrFn: PropertyTypeInFunction<any>) {
        return typeof nameOrFn === "string" ? nameOrFn : nameOrFn(this.createPropertiesMap());
    }

    /**
     * todo: undefined entities should not go there
     */
    getEntityIdMap(entity: any): ObjectLiteral|undefined {
        if (!entity)
            return undefined;

        const map: ObjectLiteral = {};
        if (this.parentEntityMetadata) {
            this.primaryColumnsWithParentIdColumns.forEach(column => {
                const entityValue = entity[column.propertyName];
                if (entityValue === null || entityValue === undefined)
                    return;

                // if entity id is a relation, then extract referenced column from that relation
                const columnRelation = this.relations.find(relation => relation.propertyName === column.propertyName);

                if (columnRelation && columnRelation.joinColumn) {
                    map[column.propertyName] = entityValue[columnRelation.joinColumn.referencedColumn.propertyName];
                } else if (columnRelation && columnRelation.inverseRelation.joinColumn) {
                    map[column.propertyName] = entityValue[columnRelation.inverseRelation.joinColumn.referencedColumn.propertyName];
                } else {
                    map[column.propertyName] = entityValue;
                }
            });

        } else {
            this.primaryColumns.forEach(column => {
                const entityValue = entity[column.propertyName];
                if (entityValue === null || entityValue === undefined)
                    return;

                // if entity id is a relation, then extract referenced column from that relation
                const columnRelation = this.relations.find(relation => relation.propertyName === column.propertyName);

                if (columnRelation && columnRelation.joinColumn) {
                    map[column.propertyName] = entityValue[columnRelation.joinColumn.referencedColumn.propertyName];
                } else if (columnRelation && columnRelation.inverseRelation.joinColumn) {
                    map[column.propertyName] = entityValue[columnRelation.inverseRelation.joinColumn.referencedColumn.propertyName];
                } else {
                    map[column.propertyName] = entityValue;
                }
            });
        }
        return Object.keys(map).length > 0 ? map : undefined;
    }

    /**
     * Same as getEntityIdMap, but instead of id column property names it returns database column names.
     */
    getDatabaseEntityIdMap(entity: ObjectLiteral): ObjectLiteral|undefined {
        const map: ObjectLiteral = {};
        if (this.parentEntityMetadata) {
            this.primaryColumnsWithParentIdColumns.forEach(column => {
                const entityValue = entity[column.propertyName];
                if (entityValue === null || entityValue === undefined)
                    return;

                // if entity id is a relation, then extract referenced column from that relation
                const columnRelation = this.relations.find(relation => relation.propertyName === column.propertyName);

                if (columnRelation && columnRelation.joinColumn) {
                    map[column.fullName] = entityValue[columnRelation.joinColumn.referencedColumn.propertyName];
                } else if (columnRelation && columnRelation.inverseRelation.joinColumn) {
                    map[column.fullName] = entityValue[columnRelation.inverseRelation.joinColumn.referencedColumn.propertyName];
                } else {
                    map[column.fullName] = entityValue;
                }
            });

        } else {
            this.primaryColumns.forEach(column => {
                const entityValue = entity[column.propertyName];
                if (entityValue === null || entityValue === undefined)
                    return;

                // if entity id is a relation, then extract referenced column from that relation
                const columnRelation = this.relations.find(relation => relation.propertyName === column.propertyName);

                if (columnRelation && columnRelation.joinColumn) {
                    map[column.fullName] = entityValue[columnRelation.joinColumn.referencedColumn.propertyName];
                } else if (columnRelation && columnRelation.inverseRelation.joinColumn) {
                    map[column.fullName] = entityValue[columnRelation.inverseRelation.joinColumn.referencedColumn.propertyName];
                } else {
                    map[column.fullName] = entityValue;
                }
            });
        }
        const hasAllIds = Object.keys(map).every(key => {
            return map[key] !== undefined && map[key] !== null;
        });
        return hasAllIds ? map : undefined;
    }

    /**

    createSimpleIdMap(id: any): ObjectLiteral {
        const map: ObjectLiteral = {};
        if (this.parentEntityMetadata) {
            this.primaryColumnsWithParentIdColumns.forEach(column => {
                map[column.propertyName] = id;
            });

        } else {
            this.primaryColumns.forEach(column => {
                map[column.propertyName] = id;
            });
        }
        return map;
    } */

    /**
     * Same as createSimpleIdMap, but instead of id column property names it returns database column names.

    createSimpleDatabaseIdMap(id: any): ObjectLiteral {
        const map: ObjectLiteral = {};
        if (this.parentEntityMetadata) {
            this.primaryColumnsWithParentIdColumns.forEach(column => {
                map[column.name] = id;
            });

        } else {
            this.primaryColumns.forEach(column => {
                map[column.name] = id;
            });
        }
        return map;
    }*/

    /**
     * todo: undefined entities should not go there??
     * todo: shouldnt be entity ObjectLiteral here?
     */
    getEntityIdMixedMap(entity: any): any {
        if (!entity)
            return undefined;

        const idMap = this.getEntityIdMap(entity);
        if (this.hasMultiplePrimaryKeys) {
            return idMap;

        } else if (idMap) {
            return idMap[this.firstPrimaryColumn.propertyName]; // todo: what about parent primary column?
        }

        return idMap;
    }

    /**
     * Same as `getEntityIdMap` but the key of the map will be the column names instead of the property names.
     */
    getEntityIdColumnMap(entity: any): ObjectLiteral|undefined {
        return this.transformIdMapToColumnNames(this.getEntityIdMap(entity));
    }

    transformIdMapToColumnNames(idMap: ObjectLiteral|undefined) {
        if (!idMap) {
            return idMap;
        }
        const map: ObjectLiteral = {};
        Object.keys(idMap).forEach(propertyName => {
            const column = this.getColumnByPropertyName(propertyName);
            if (column) {
                map[column.fullName] = idMap[propertyName];
            }
        });
        return map;
    }

    getColumnByPropertyName(propertyName: string) {
        return this._columns.find(column => column.propertyName === propertyName);
    }

    /**
     * Checks if column with the given property name exist.
     */
    hasColumnWithPropertyName(propertyName: string): boolean {
        return !!this._columns.find(column => column.propertyName === propertyName);
    }

    /**
     * Checks if column with the given database name exist.
     */
    hasColumnWithDbName(name: string): boolean {
        return !!this._columns.find(column => column.fullName === name);
    }

    /**
     * Checks if relation with the given property name exist.
     */
    hasRelationWithPropertyName(propertyName: string): boolean {
        return !!this.relations.find(relation => relation.propertyName === propertyName);
    }

    /**
     * Finds relation with the given property name.
     */
    findRelationWithPropertyName(propertyName: string): RelationMetadata {
        const relation = this.relations.find(relation => relation.propertyName === propertyName);
        if (!relation)
            throw new Error(`Relation with property name ${propertyName} in ${this.name} entity was not found.`);

        return relation;
    }

    /**
     * Checks if relation with the given name exist.
     */
    hasRelationWithDbName(dbName: string): boolean {
        return !!this.relationsWithJoinColumns.find(relation => relation.name === dbName);
    }

    /**
     * Finds relation with the given name.
     */
    findRelationWithDbName(name: string): RelationMetadata {
        const relation = this.relationsWithJoinColumns.find(relation => relation.name === name);
        if (!relation)
            throw new Error(`Relation with name ${name} in ${this.name} entity was not found.`);

        return relation;
    }

    addColumn(column: ColumnMetadata) {
        this._columns.push(column);
        column.entityMetadata = this;
    }

    extractNonEmptyColumns(object: ObjectLiteral): ColumnMetadata[] {
        return this.columns.filter(column => !!object[column.propertyName]);
    }

    extractNonEmptySingleValueRelations(object: ObjectLiteral): RelationMetadata[] {
        return this.relations.filter(relation => {
            return (relation.relationType === RelationTypes.ONE_TO_ONE || relation.relationType === RelationTypes.MANY_TO_ONE)
                && !!object[relation.propertyName];
        });
    }

    extractNonEmptyMultiValueRelations(object: ObjectLiteral): RelationMetadata[] {
        return this.relations.filter(relation => {
            return (relation.relationType === RelationTypes.MANY_TO_MANY || relation.relationType === RelationTypes.ONE_TO_MANY)
                && !!object[relation.propertyName];
        });
    }

    extractExistSingleValueRelations(object: ObjectLiteral): RelationMetadata[] {
        return this.relations.filter(relation => {
            return (relation.relationType === RelationTypes.ONE_TO_ONE || relation.relationType === RelationTypes.MANY_TO_ONE)
                && object.hasOwnProperty(relation.propertyName);
        });
    }

    extractExistMultiValueRelations(object: ObjectLiteral): RelationMetadata[] {
        return this.relations.filter(relation => {
            return (relation.relationType === RelationTypes.MANY_TO_MANY || relation.relationType === RelationTypes.ONE_TO_MANY)
                && object.hasOwnProperty(relation.propertyName);
        });
    }

    checkIfObjectContainsAllPrimaryKeys(object: ObjectLiteral) {
        return this.primaryColumns.every(primaryColumn => {
            return object.hasOwnProperty(primaryColumn.propertyName);
        });
    }

    compareEntities(firstEntity: any, secondEntity: any) {
        const firstEntityIds = this.getEntityIdMap(firstEntity);
        const secondEntityIds = this.getEntityIdMap(secondEntity);
        return this.compareIds(firstEntityIds, secondEntityIds);
    }

    compareIds(firstId: ObjectLiteral|undefined, secondId: ObjectLiteral|undefined): boolean {
        if (firstId === undefined || firstId === null || secondId === undefined || secondId === null)
            return false;

        return Object.keys(firstId).every(key => {
            if (firstId[key] instanceof Object && secondId[key] instanceof Object)
                return firstId[key].equals(secondId[key]);

            return firstId[key] === secondId[key];
        });
    }

    /**
     * Compares two entity ids.
     * If any of the given value is empty then it will return false.
     */
    compareEntityMixedIds(firstId: any, secondId: any): boolean {
        if (firstId === undefined || firstId === null || secondId === undefined || secondId === null)
            return false;

        if (this.hasMultiplePrimaryKeys) {
            return Object.keys(firstId).every(key => {
                return firstId[key] === secondId[key];
            });
        } else {
            return firstId === secondId;
        }
    }

    /**
     * Iterates throw entity and finds and extracts all values from relations in the entity.
     * If relation value is an array its being flattened.
     */
    extractRelationValuesFromEntity(entity: ObjectLiteral, relations: RelationMetadata[]): [RelationMetadata, any, EntityMetadata][] {
        const relationsAndValues: [RelationMetadata, any, EntityMetadata][] = [];
        relations.forEach(relation => {
            const value = relation.getEntityValue(entity);
            if (value instanceof Array) {
                value.forEach(subValue => relationsAndValues.push([relation, subValue, relation.inverseEntityMetadata]));
            } else if (value) {
                relationsAndValues.push([relation, value, relation.inverseEntityMetadata]);
            }
        });
        return relationsAndValues;
    }

    /**
     * Checks if given entity has an id.
     */
    hasId(entity: ObjectLiteral): boolean {

        // if (this.metadata.parentEntityMetadata) {
        //     return this.metadata.parentEntityMetadata.parentIdColumns.every(parentIdColumn => {
        //         const columnName = parentIdColumn.propertyName;
        //         return !!entity &&
        //             entity.hasOwnProperty(columnName) &&
        //             entity[columnName] !== null &&
        //             entity[columnName] !== undefined &&
        //             entity[columnName] !== "";
        //     });

        // } else {
        return this.primaryColumns.every(primaryColumn => {
            const columnName = primaryColumn.propertyName;
            return !!entity &&
                entity.hasOwnProperty(columnName) &&
                entity[columnName] !== null &&
                entity[columnName] !== undefined &&
                entity[columnName] !== "";
        });
        // }
    }

    /**
     * Checks if there any non-nullable column exist in this entity.
     */
    get hasNonNullableColumns(): boolean {
        return this.relationsWithJoinColumns.some(relation => !relation.isNullable || relation.isPrimary);
        // return this.relationsWithJoinColumns.some(relation => relation.isNullable || relation.isPrimary);
    }

}