import { PostgresDriver } from "../driver/postgres/PostgresDriver";
import { SapDriver } from "../driver/sap/SapDriver";
import { SqlServerDriver } from "../driver/sqlserver/SqlServerDriver";
import { OracleDriver } from "../driver/oracle/OracleDriver";
import { CannotCreateEntityIdMapError } from "../error/CannotCreateEntityIdMapError";
import { OrmUtils } from "../util/OrmUtils";
import { shorten } from "../util/StringUtils";
/**
 * Contains all entity metadata.
 */
export class EntityMetadata {
    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------
    constructor(options) {
        /**
         * Children entity metadatas. Used in inheritance patterns.
         */
        this.childEntityMetadatas = [];
        /**
         * All "inheritance tree" from a target entity.
         * For example for target Post < ContentModel < Unit it will be an array of [Post, ContentModel, Unit].
         * It also contains child entities for single table inheritance.
         */
        this.inheritanceTree = [];
        /**
         * Table type. Tables can be abstract, closure, junction, embedded, etc.
         */
        this.tableType = "regular";
        /**
         * Enables Sqlite "WITHOUT ROWID" modifier for the "CREATE TABLE" statement
         */
        this.withoutRowid = false;
        /**
         * Indicates if schema will be synchronized for this entity or not.
         */
        this.synchronize = true;
        /**
         * Checks if there any non-nullable column exist in this entity.
         */
        this.hasNonNullableRelations = false;
        /**
         * Indicates if this entity metadata of a junction table, or not.
         * Junction table is a table created by many-to-many relationship.
         *
         * Its also possible to understand if entity is junction via tableType.
         */
        this.isJunction = false;
        /**
         * Checks if this table is a junction table of the closure table.
         * This type is for tables that contain junction metadata of the closure tables.
         */
        this.isClosureJunction = false;
        /**
         * Checks if entity's table has multiple primary columns.
         */
        this.hasMultiplePrimaryKeys = false;
        /**
         * Indicates if this entity metadata has uuid generated columns.
         */
        this.hasUUIDGeneratedColumns = false;
        /**
         * Entity's column metadatas defined by user.
         */
        this.ownColumns = [];
        /**
         * Columns of the entity, including columns that are coming from the embeddeds of this entity.
         */
        this.columns = [];
        /**
         * Ancestor columns used only in closure junction tables.
         */
        this.ancestorColumns = [];
        /**
         * Descendant columns used only in closure junction tables.
         */
        this.descendantColumns = [];
        /**
         * All columns except for virtual columns.
         */
        this.nonVirtualColumns = [];
        /**
         * In the case if this entity metadata is junction table's entity metadata,
         * this will contain all referenced columns of owner entity.
         */
        this.ownerColumns = [];
        /**
         * In the case if this entity metadata is junction table's entity metadata,
         * this will contain all referenced columns of inverse entity.
         */
        this.inverseColumns = [];
        /**
         * Gets the column with generated flag.
         */
        this.generatedColumns = [];
        /**
         * Gets the primary columns.
         */
        this.primaryColumns = [];
        /**
         * Entity's relation metadatas.
         */
        this.ownRelations = [];
        /**
         * Relations of the entity, including relations that are coming from the embeddeds of this entity.
         */
        this.relations = [];
        /**
         * List of eager relations this metadata has.
         */
        this.eagerRelations = [];
        /**
         * List of eager relations this metadata has.
         */
        this.lazyRelations = [];
        /**
         * Gets only one-to-one relations of the entity.
         */
        this.oneToOneRelations = [];
        /**
         * Gets only owner one-to-one relations of the entity.
         */
        this.ownerOneToOneRelations = [];
        /**
         * Gets only one-to-many relations of the entity.
         */
        this.oneToManyRelations = [];
        /**
         * Gets only many-to-one relations of the entity.
         */
        this.manyToOneRelations = [];
        /**
         * Gets only many-to-many relations of the entity.
         */
        this.manyToManyRelations = [];
        /**
         * Gets only owner many-to-many relations of the entity.
         */
        this.ownerManyToManyRelations = [];
        /**
         * Gets only owner one-to-one and many-to-one relations.
         */
        this.relationsWithJoinColumns = [];
        /**
         * Entity's relation id metadatas.
         */
        this.relationIds = [];
        /**
         * Entity's relation id metadatas.
         */
        this.relationCounts = [];
        /**
         * Entity's foreign key metadatas.
         */
        this.foreignKeys = [];
        /**
         * Entity's embedded metadatas.
         */
        this.embeddeds = [];
        /**
         * All embeddeds - embeddeds from this entity metadata and from all child embeddeds, etc.
         */
        this.allEmbeddeds = [];
        /**
         * Entity's own indices.
         */
        this.ownIndices = [];
        /**
         * Entity's index metadatas.
         */
        this.indices = [];
        /**
         * Entity's unique metadatas.
         */
        this.uniques = [];
        /**
         * Entity's own uniques.
         */
        this.ownUniques = [];
        /**
         * Entity's check metadatas.
         */
        this.checks = [];
        /**
         * Entity's exclusion metadatas.
         */
        this.exclusions = [];
        /**
         * Entity's own listener metadatas.
         */
        this.ownListeners = [];
        /**
         * Entity listener metadatas.
         */
        this.listeners = [];
        /**
         * Listener metadatas with "AFTER LOAD" type.
         */
        this.afterLoadListeners = [];
        /**
         * Listener metadatas with "AFTER INSERT" type.
         */
        this.beforeInsertListeners = [];
        /**
         * Listener metadatas with "AFTER INSERT" type.
         */
        this.afterInsertListeners = [];
        /**
         * Listener metadatas with "AFTER UPDATE" type.
         */
        this.beforeUpdateListeners = [];
        /**
         * Listener metadatas with "AFTER UPDATE" type.
         */
        this.afterUpdateListeners = [];
        /**
         * Listener metadatas with "AFTER REMOVE" type.
         */
        this.beforeRemoveListeners = [];
        /**
         * Listener metadatas with "AFTER REMOVE" type.
         */
        this.afterRemoveListeners = [];
        this.connection = options.connection;
        this.inheritanceTree = options.inheritanceTree || [];
        this.inheritancePattern = options.inheritancePattern;
        this.treeType = options.tableTree ? options.tableTree.type : undefined;
        this.treeOptions = options.tableTree ? options.tableTree.options : undefined;
        this.parentClosureEntityMetadata = options.parentClosureEntityMetadata;
        this.tableMetadataArgs = options.args;
        this.target = this.tableMetadataArgs.target;
        this.tableType = this.tableMetadataArgs.type;
        this.expression = this.tableMetadataArgs.expression;
        this.withoutRowid = this.tableMetadataArgs.withoutRowid;
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Creates a new entity.
     */
    create(queryRunner) {
        // if target is set to a function (e.g. class) that can be created then create it
        let ret;
        if (this.target instanceof Function) {
            ret = new this.target();
            this.lazyRelations.forEach(relation => this.connection.relationLoader.enableLazyLoad(relation, ret, queryRunner));
            return ret;
        }
        // otherwise simply return a new empty object
        const newObject = {};
        this.lazyRelations.forEach(relation => this.connection.relationLoader.enableLazyLoad(relation, newObject, queryRunner));
        return newObject;
    }
    /**
     * Checks if given entity has an id.
     */
    hasId(entity) {
        if (!entity)
            return false;
        return this.primaryColumns.every(primaryColumn => {
            const value = primaryColumn.getEntityValue(entity);
            return value !== null && value !== undefined && value !== "";
        });
    }
    /**
     * Checks if given entity / object contains ALL primary keys entity must have.
     * Returns true if it contains all of them, false if at least one of them is not defined.
     */
    hasAllPrimaryKeys(entity) {
        return this.primaryColumns.every(primaryColumn => {
            const value = primaryColumn.getEntityValue(entity);
            return value !== null && value !== undefined;
        });
    }
    /**
     * Ensures that given object is an entity id map.
     * If given id is an object then it means its already id map.
     * If given id isn't an object then it means its a value of the id column
     * and it creates a new id map with this value and name of the primary column.
     */
    ensureEntityIdMap(id) {
        if (id instanceof Object)
            return id;
        if (this.hasMultiplePrimaryKeys)
            throw new CannotCreateEntityIdMapError(this, id);
        return this.primaryColumns[0].createValueMap(id);
    }
    /**
     * Gets primary keys of the entity and returns them in a literal object.
     * For example, for Post{ id: 1, title: "hello" } where id is primary it will return { id: 1 }
     * For multiple primary keys it returns multiple keys in object.
     * For primary keys inside embeds it returns complex object literal with keys in them.
     */
    getEntityIdMap(entity) {
        if (!entity)
            return undefined;
        return EntityMetadata.getValueMap(entity, this.primaryColumns, { skipNulls: true });
    }
    /**
     * Creates a "mixed id map".
     * If entity has multiple primary keys (ids) then it will return just regular id map, like what getEntityIdMap returns.
     * But if entity has a single primary key then it will return just value of the id column of the entity, just value.
     * This is called mixed id map.
     */
    getEntityIdMixedMap(entity) {
        if (!entity)
            return entity;
        const idMap = this.getEntityIdMap(entity);
        if (this.hasMultiplePrimaryKeys) {
            return idMap;
        }
        else if (idMap) {
            return this.primaryColumns[0].getEntityValue(idMap); // todo: what about parent primary column?
        }
        return idMap;
    }
    /**
     * Compares two different entities by their ids.
     * Returns true if they match, false otherwise.
     */
    compareEntities(firstEntity, secondEntity) {
        const firstEntityIdMap = this.getEntityIdMap(firstEntity);
        if (!firstEntityIdMap)
            return false;
        const secondEntityIdMap = this.getEntityIdMap(secondEntity);
        if (!secondEntityIdMap)
            return false;
        return OrmUtils.compareIds(firstEntityIdMap, secondEntityIdMap);
    }
    /**
     * Finds column with a given property name.
     */
    findColumnWithPropertyName(propertyName) {
        return this.columns.find(column => column.propertyName === propertyName);
    }
    /**
     * Finds column with a given database name.
     */
    findColumnWithDatabaseName(databaseName) {
        return this.columns.find(column => column.databaseName === databaseName);
    }
    /**
     * Finds column with a given property path.
     */
    findColumnWithPropertyPath(propertyPath) {
        const column = this.columns.find(column => column.propertyPath === propertyPath);
        if (column)
            return column;
        // in the case if column with property path was not found, try to find a relation with such property path
        // if we find relation and it has a single join column then its the column user was seeking
        const relation = this.relations.find(relation => relation.propertyPath === propertyPath);
        if (relation && relation.joinColumns.length === 1)
            return relation.joinColumns[0];
        return undefined;
    }
    /**
     * Finds columns with a given property path.
     * Property path can match a relation, and relations can contain multiple columns.
     */
    findColumnsWithPropertyPath(propertyPath) {
        const column = this.columns.find(column => column.propertyPath === propertyPath);
        if (column)
            return [column];
        // in the case if column with property path was not found, try to find a relation with such property path
        // if we find relation and it has a single join column then its the column user was seeking
        const relation = this.relations.find(relation => relation.propertyPath === propertyPath);
        if (relation && relation.joinColumns)
            return relation.joinColumns;
        return [];
    }
    /**
     * Finds relation with the given property path.
     */
    findRelationWithPropertyPath(propertyPath) {
        return this.relations.find(relation => relation.propertyPath === propertyPath);
    }
    /**
     * Checks if there is an embedded with a given property path.
     */
    hasEmbeddedWithPropertyPath(propertyPath) {
        return this.allEmbeddeds.some(embedded => embedded.propertyPath === propertyPath);
    }
    /**
     * Finds embedded with a given property path.
     */
    findEmbeddedWithPropertyPath(propertyPath) {
        return this.allEmbeddeds.find(embedded => embedded.propertyPath === propertyPath);
    }
    /**
     * Iterates through entity and finds and extracts all values from relations in the entity.
     * If relation value is an array its being flattened.
     */
    extractRelationValuesFromEntity(entity, relations) {
        const relationsAndValues = [];
        relations.forEach(relation => {
            const value = relation.getEntityValue(entity);
            if (Array.isArray(value)) {
                value.forEach(subValue => relationsAndValues.push([relation, subValue, this.getInverseEntityMetadata(subValue, relation)]));
            }
            else if (value) {
                relationsAndValues.push([relation, value, this.getInverseEntityMetadata(value, relation)]);
            }
        });
        return relationsAndValues;
    }
    getInverseEntityMetadata(value, relation) {
        const childEntityMetadata = relation.inverseEntityMetadata.childEntityMetadatas.find(metadata => metadata.target === value.constructor);
        return childEntityMetadata ? childEntityMetadata : relation.inverseEntityMetadata;
    }
    // -------------------------------------------------------------------------
    // Public Static Methods
    // -------------------------------------------------------------------------
    /**
     * Creates a property paths for a given entity.
     */
    static createPropertyPath(metadata, entity, prefix = "") {
        const paths = [];
        Object.keys(entity).forEach(key => {
            // check for function is needed in the cases when createPropertyPath used on values containg a function as a value
            // example: .update().set({ name: () => `SUBSTR('', 1, 2)` })
            const parentPath = prefix ? prefix + "." + key : key;
            if (metadata.hasEmbeddedWithPropertyPath(parentPath)) {
                const subPaths = this.createPropertyPath(metadata, entity[key], parentPath);
                paths.push(...subPaths);
            }
            else {
                const path = prefix ? prefix + "." + key : key;
                paths.push(path);
            }
        });
        return paths;
    }
    /**
     * Finds difference between two entity id maps.
     * Returns items that exist in the first array and absent in the second array.
     */
    static difference(firstIdMaps, secondIdMaps) {
        return firstIdMaps.filter(firstIdMap => {
            return !secondIdMaps.find(secondIdMap => OrmUtils.compareIds(firstIdMap, secondIdMap));
        });
    }
    /**
     * Creates value map from the given values and columns.
     * Examples of usages are primary columns map and join columns map.
     */
    static getValueMap(entity, columns, options) {
        return columns.reduce((map, column) => {
            const value = column.getEntityValueMap(entity, options);
            // make sure that none of the values of the columns are not missing
            if (map === undefined || value === null || value === undefined)
                return undefined;
            return column.isObjectId ? Object.assign(map, value) : OrmUtils.mergeDeep(map, value);
        }, {});
    }
    // ---------------------------------------------------------------------
    // Public Builder Methods
    // ---------------------------------------------------------------------
    build() {
        const namingStrategy = this.connection.namingStrategy;
        const entityPrefix = this.connection.options.entityPrefix;
        this.engine = this.tableMetadataArgs.engine;
        this.database = this.tableMetadataArgs.type === "entity-child" && this.parentEntityMetadata ? this.parentEntityMetadata.database : this.tableMetadataArgs.database;
        if (this.tableMetadataArgs.schema) {
            this.schema = this.tableMetadataArgs.schema;
        }
        else if ((this.tableMetadataArgs.type === "entity-child") && this.parentEntityMetadata) {
            this.schema = this.parentEntityMetadata.schema;
        }
        else {
            this.schema = this.connection.options.schema;
        }
        this.givenTableName = this.tableMetadataArgs.type === "entity-child" && this.parentEntityMetadata ? this.parentEntityMetadata.givenTableName : this.tableMetadataArgs.name;
        this.synchronize = this.tableMetadataArgs.synchronize === false ? false : true;
        this.targetName = this.tableMetadataArgs.target instanceof Function ? this.tableMetadataArgs.target.name : this.tableMetadataArgs.target;
        if (this.tableMetadataArgs.type === "closure-junction") {
            this.tableNameWithoutPrefix = namingStrategy.closureJunctionTableName(this.givenTableName);
        }
        else if (this.tableMetadataArgs.type === "entity-child" && this.parentEntityMetadata) {
            this.tableNameWithoutPrefix = namingStrategy.tableName(this.parentEntityMetadata.targetName, this.parentEntityMetadata.givenTableName);
        }
        else {
            this.tableNameWithoutPrefix = namingStrategy.tableName(this.targetName, this.givenTableName);
            if (this.connection.driver.maxAliasLength && this.connection.driver.maxAliasLength > 0 && this.tableNameWithoutPrefix.length > this.connection.driver.maxAliasLength) {
                this.tableNameWithoutPrefix = shorten(this.tableNameWithoutPrefix, { separator: "_", segmentLength: 3 });
            }
        }
        this.tableName = entityPrefix ? namingStrategy.prefixTableName(entityPrefix, this.tableNameWithoutPrefix) : this.tableNameWithoutPrefix;
        this.target = this.target ? this.target : this.tableName;
        this.name = this.targetName ? this.targetName : this.tableName;
        this.expression = this.tableMetadataArgs.expression;
        this.withoutRowid = this.tableMetadataArgs.withoutRowid === true ? true : false;
        this.tablePath = this.buildTablePath();
        this.schemaPath = this.buildSchemaPath();
        this.orderBy = (this.tableMetadataArgs.orderBy instanceof Function) ? this.tableMetadataArgs.orderBy(this.propertiesMap) : this.tableMetadataArgs.orderBy; // todo: is propertiesMap available here? Looks like its not
        this.isJunction = this.tableMetadataArgs.type === "closure-junction" || this.tableMetadataArgs.type === "junction";
        this.isClosureJunction = this.tableMetadataArgs.type === "closure-junction";
    }
    /**
     * Registers a new column in the entity and recomputes all depend properties.
     */
    registerColumn(column) {
        if (this.ownColumns.indexOf(column) !== -1)
            return;
        this.ownColumns.push(column);
        this.columns = this.embeddeds.reduce((columns, embedded) => columns.concat(embedded.columnsFromTree), this.ownColumns);
        this.primaryColumns = this.columns.filter(column => column.isPrimary);
        this.hasMultiplePrimaryKeys = this.primaryColumns.length > 1;
        this.hasUUIDGeneratedColumns = this.columns.filter(column => column.isGenerated || column.generationStrategy === "uuid").length > 0;
        this.propertiesMap = this.createPropertiesMap();
        if (this.childEntityMetadatas)
            this.childEntityMetadatas.forEach(entityMetadata => entityMetadata.registerColumn(column));
    }
    /**
     * Creates a special object - all columns and relations of the object (plus columns and relations from embeds)
     * in a special format - { propertyName: propertyName }.
     *
     * example: Post{ id: number, name: string, counterEmbed: { count: number }, category: Category }.
     * This method will create following object:
     * { id: "id", counterEmbed: { count: "counterEmbed.count" }, category: "category" }
     */
    createPropertiesMap() {
        const map = {};
        this.columns.forEach(column => OrmUtils.mergeDeep(map, column.createValueMap(column.propertyPath)));
        this.relations.forEach(relation => OrmUtils.mergeDeep(map, relation.createValueMap(relation.propertyPath)));
        return map;
    }
    /**
     * Builds table path using database name, schema name and table name.
     */
    buildTablePath() {
        let tablePath = this.tableName;
        if (this.schema && ((this.connection.driver instanceof OracleDriver) || (this.connection.driver instanceof PostgresDriver) || (this.connection.driver instanceof SqlServerDriver) || (this.connection.driver instanceof SapDriver))) {
            tablePath = this.schema + "." + tablePath;
        }
        if (this.database && !(this.connection.driver instanceof PostgresDriver)) {
            if (!this.schema && this.connection.driver instanceof SqlServerDriver) {
                tablePath = this.database + ".." + tablePath;
            }
            else {
                tablePath = this.database + "." + tablePath;
            }
        }
        return tablePath;
    }
    /**
     * Builds table path using schema name and database name.
     */
    buildSchemaPath() {
        if (!this.schema)
            return undefined;
        return this.database && !(this.connection.driver instanceof PostgresDriver) ? this.database + "." + this.schema : this.schema;
    }
}

//# sourceMappingURL=EntityMetadata.js.map
