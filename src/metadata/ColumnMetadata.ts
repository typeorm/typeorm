import {ColumnType} from "../driver/types/ColumnTypes";
import {EntityMetadata} from "./EntityMetadata";
import {EmbeddedMetadata} from "./EmbeddedMetadata";
import {RelationMetadata} from "./RelationMetadata";
import {ObjectLiteral} from "../common/ObjectLiteral";
import {ColumnMetadataArgs} from "../metadata-args/ColumnMetadataArgs";
import {Connection} from "../connection/Connection";
import {OrmUtils} from "../util/OrmUtils";
import {ValueTransformer} from "../decorator/options/ValueTransformer";
import {MongoDriver} from "../driver/mongodb/MongoDriver";
import {ApplyValueTransformers} from "../util/ApplyValueTransformers";
import {ExpressionBuilder} from "../expression-builder/Expression";

/**
 * This metadata contains all information about entity's column.
 */
export class ColumnMetadata {

    // ---------------------------------------------------------------------
    // Public Properties
    // ---------------------------------------------------------------------

    /**
     * Target class where column decorator is used.
     * This may not be always equal to entity metadata (for example embeds or inheritance cases).
     */
    target: Function|string;

    /**
     * Entity metadata where this column metadata is.
     *
     * For example for @Column() name: string in Post, entityMetadata will be metadata of Post entity.
     */
    entityMetadata: EntityMetadata;

    /**
     * Embedded metadata where this column metadata is.
     * If this column is not in embed then this property value is undefined.
     */
    embeddedMetadata?: EmbeddedMetadata;

    /**
     * If column is a foreign key of some relation then this relation's metadata will be there.
     * If this column does not have a foreign key then this property value is undefined.
     */
    relationMetadata?: RelationMetadata;

    /**
     * Class's property name on which this column is applied.
     */
    propertyName: string;

    /**
     * The database type of the column.
     */
    type: ColumnType;

    /**
     * Type's length in the database.
     */
    length: string = "";

    /**
     * Type's display width in the database.
     */
    width?: number;

    /**
     * Defines column character set.
     */
    charset?: string;

    /**
     * Defines column collation.
     */
    collation?: string;

    /**
     * Indicates if this column is a primary key.
     */
    isPrimary: boolean = false;

    /**
     * Indicates if this column is generated (auto increment or generated other way).
     */
    isGenerated: boolean = false;

    /**
     * Indicates if column can contain nulls or not.
     */
    isNullable: boolean = false;

    /**
     * Indicates if column is selected by query builder or not.
     */
    isSelect: boolean = true;

    /**
     * Indicates if column is inserted by default or not.
     */
    isInsert: boolean = true;

    /**
     * Indicates if column allows updates or not.
     */
    isUpdate: boolean = true;

    /**
     * Specifies generation strategy if this column will use auto increment.
     */
    generationStrategy?: "uuid"|"increment"|"rowid";

    /**
     * Column comment.
     * This feature is not supported by all databases.
     */
    comment?: string;

    /**
     * Default database value.
     */
    default?: any;

    /**
     * ON UPDATE trigger. Works only for MySQL.
     */
    onUpdate?: string;

    /**
     * The precision for a decimal (exact numeric) column (applies only for decimal column),
     * which is the maximum number of digits that are stored for the values.
     */
    precision?: number|null;

    /**
     * The scale for a decimal (exact numeric) column (applies only for decimal column),
     * which represents the number of digits to the right of the decimal point and must not be greater than precision.
     */
    scale?: number;

    /**
     * Puts ZEROFILL attribute on to numeric column. Works only for MySQL.
     * If you specify ZEROFILL for a numeric column, MySQL automatically adds the UNSIGNED attribute to the column
     */
    zerofill: boolean = false;

    /**
     * Puts UNSIGNED attribute on to numeric column. Works only for MySQL.
     */
    unsigned: boolean = false;

    /**
     * Array of possible enumerated values.
     *
     * `postgres` and `mysql` store enum values as strings but we want to keep support
     * for numeric and heterogeneous based typescript enums, so we need (string|number)[]
     */
    enum?: (string|number)[];

    /**
     * Exact name of enum
     */
    enumName?: string;

    /**
     * Generated column expression. Supports only in MySQL.
     */
    asExpression?: string;

    /**
     * Generated column type. Supports only in MySQL.
     */
    generatedType?: "VIRTUAL"|"STORED";

    /**
     * Return type of HSTORE column.
     * Returns value as string or as object.
     */
    hstoreType?: "object"|"string";

    /**
     * Indicates if this column is an array.
     */
    isArray: boolean = false;

    /**
     * Gets full path to this column property (including column property name).
     * Full path is relevant when column is used in embeds (one or multiple nested).
     * For example it will return "counters.subcounters.likes".
     * If property is not in embeds then it returns just property name of the column.
     */
    propertyPath: string;

    /**
     * Same as property path, but dots are replaced with '_'.
     * Used in query builder statements.
     */
    propertyAliasName: string;

    /**
     * Gets full path to this column database name (including column database name).
     * Full path is relevant when column is used in embeds (one or multiple nested).
     * For example it will return "counters.subcounters.likes".
     * If property is not in embeds then it returns just database name of the column.
     */
    databasePath: string;

    /**
     * Complete column name in the database including its embedded prefixes.
     */
    databaseName: string;

    /**
     * Database name in the database without embedded prefixes applied.
     */
    databaseNameWithoutPrefixes: string;

    /**
     * Database name set by entity metadata builder, not yet passed naming strategy process and without embedded prefixes.
     */
    givenDatabaseName?: string;

    /**
     * Indicates if column is an internal column. Internal columns are not mapped to the entity.
     */
    isInternal: boolean = false;

    /**
     * Indicates if column is discriminator. Discriminator columns are not mapped to the entity.
     */
    isDiscriminator: boolean = false;

    /**
     * Indicates if column is tree-level column. Tree-level columns are used in closure entities.
     */
    isTreeLevel: boolean = false;

    /**
     * Indicates if this column contains an entity creation date.
     */
    isCreateDate: boolean = false;

    /**
     * Indicates if this column contains an entity update date.
     */
    isUpdateDate: boolean = false;

    /**
     * Indicates if this column contains an entity delete date.
     */
    isDeleteDate: boolean = false;

    /**
     * Indicates if this column contains an entity version.
     */
    isVersion: boolean = false;

    /**
     * Indicates if this column contains an object id.
     */
    isObjectId: boolean = false;

    /**
     * If this column is foreign key then it references some other column,
     * and this property will contain reference to this column.
     */
    referencedColumn: ColumnMetadata|undefined;

    /**
     * Specifies a value transformer that is to be used to (un)marshal
     * this column when reading or writing to the database.
     */
    transformer?: ValueTransformer|ValueTransformer[];

    /**
     * Column type in the case if this column is in the closure table.
     * Column can be ancestor or descendant in the closure tables.
     */
    closureType?: "ancestor"|"descendant";

    /**
     * Indicates if this column is nested set's left column.
     * Used only in tree entities with nested-set type.
     */
    isNestedSetLeft: boolean = false;

    /**
     * Indicates if this column is nested set's right column.
     * Used only in tree entities with nested-set type.
     */
    isNestedSetRight: boolean = false;

    /**
     * Indicates if this column is materialized path's path column.
     * Used only in tree entities with materialized path type.
     */
    isMaterializedPath: boolean = false;

    /**
     * Spatial Feature Type (Geometry, Point, Polygon, etc.)
     */
    spatialFeatureType?: string;

    /**
     * SRID (Spatial Reference ID (EPSG code))
     */
    srid?: number;

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(options: {
        connection: Connection,
        entityMetadata: EntityMetadata,
        embeddedMetadata?: EmbeddedMetadata,
        referencedColumn?: ColumnMetadata,
        args: ColumnMetadataArgs,
        closureType?: "ancestor"|"descendant",
        nestedSetLeft?: boolean,
        nestedSetRight?: boolean,
        materializedPath?: boolean,
    }) {
        this.entityMetadata = options.entityMetadata;
        this.embeddedMetadata = options.embeddedMetadata!;
        this.referencedColumn = options.referencedColumn;
        if (options.args.target)
            this.target = options.args.target;
        if (options.args.propertyName)
            this.propertyName = options.args.propertyName;
        if (options.args.options.name)
            this.givenDatabaseName = options.args.options.name;
        if (options.args.options.type)
            this.type = options.args.options.type;
        if (options.args.options.length)
            this.length = options.args.options.length ? options.args.options.length.toString() : "";
        if (options.args.options.width)
            this.width = options.args.options.width;
        if (options.args.options.charset)
            this.charset = options.args.options.charset;
        if (options.args.options.collation)
            this.collation = options.args.options.collation;
        if (options.args.options.primary)
            this.isPrimary = options.args.options.primary;
        if (options.args.options.default === null) // to make sure default: null is the same as nullable: true
            this.isNullable = true;
        if (options.args.options.nullable !== undefined)
            this.isNullable = options.args.options.nullable;
        if (options.args.options.select !== undefined)
            this.isSelect = options.args.options.select;
        if (options.args.options.insert !== undefined)
            this.isInsert = options.args.options.insert;
        if (options.args.options.update !== undefined)
            this.isUpdate = options.args.options.update;
        if (options.args.options.readonly !== undefined)
            this.isUpdate = !options.args.options.readonly;
        if (options.args.options.comment)
            this.comment = options.args.options.comment;
        if (options.args.options.default !== undefined)
            this.default = options.args.options.default;
        if (options.args.options.onUpdate)
            this.onUpdate = options.args.options.onUpdate;
        if (options.args.options.scale !== null && options.args.options.scale !== undefined)
            this.scale = options.args.options.scale;
        if (options.args.options.zerofill) {
            this.zerofill = options.args.options.zerofill;
            this.unsigned = true; // if you specify ZEROFILL for a numeric column, MySQL automatically adds the UNSIGNED attribute to the column
        }
        if (options.args.options.unsigned)
            this.unsigned = options.args.options.unsigned;
        if (options.args.options.precision !== undefined)
            this.precision = options.args.options.precision;
        if (options.args.options.enum) {
            if (options.args.options.enum instanceof Object && !Array.isArray(options.args.options.enum)) {
                this.enum = Object.keys(options.args.options.enum)
                    .filter(key => isNaN(+key))     // remove numeric keys - typescript numeric enum types generate them
                    .map(key => (options.args.options.enum as ObjectLiteral)[key]);

            } else {
                this.enum = options.args.options.enum;
            }
        }
        if (options.args.options.enumName) {
            this.enumName = options.args.options.enumName;
        }
        if (options.args.options.asExpression) {
            this.asExpression = options.args.options.asExpression;
            this.generatedType = options.args.options.generatedType ? options.args.options.generatedType : "VIRTUAL";
        }
        if (options.args.options.hstoreType)
            this.hstoreType = options.args.options.hstoreType;
        if (options.args.options.array)
            this.isArray = options.args.options.array;
        if (options.args.mode) {
            this.isInternal = options.args.mode === "internal";
            this.isTreeLevel = options.args.mode === "treeLevel";
            this.isCreateDate = options.args.mode === "createDate";
            this.isUpdateDate = options.args.mode === "updateDate";
            this.isDeleteDate = options.args.mode === "deleteDate";
            this.isVersion = options.args.mode === "version";
            this.isObjectId = options.args.mode === "objectId";
        }
        if (options.args.options.transformer)
            this.transformer = options.args.options.transformer;
        if (options.args.options.spatialFeatureType)
            this.spatialFeatureType = options.args.options.spatialFeatureType;
        if (options.args.options.srid !== undefined)
            this.srid = options.args.options.srid;
        if (this.isTreeLevel)
            this.type = options.connection.driver.mappedDataTypes.treeLevel;
        if (this.isCreateDate) {
            if (!this.type)
                this.type = options.connection.driver.mappedDataTypes.createDate;
            if (!this.default)
                this.default = () => options.connection.driver.mappedDataTypes.createDateDefault;
            if (this.precision === undefined && options.connection.driver.mappedDataTypes.createDatePrecision)
                this.precision = options.connection.driver.mappedDataTypes.createDatePrecision;
        }
        if (this.isUpdateDate) {
            if (!this.type)
                this.type = options.connection.driver.mappedDataTypes.updateDate;
            if (!this.default)
                this.default = () => options.connection.driver.mappedDataTypes.updateDateDefault;
            if (!this.onUpdate)
                this.onUpdate = options.connection.driver.mappedDataTypes.updateDateDefault;
            if (this.precision === undefined && options.connection.driver.mappedDataTypes.updateDatePrecision)
                this.precision = options.connection.driver.mappedDataTypes.updateDatePrecision;
        }
        if (this.isDeleteDate) {
            if (!this.type)
                this.type = options.connection.driver.mappedDataTypes.deleteDate;
            if (!this.isNullable)
                this.isNullable = options.connection.driver.mappedDataTypes.deleteDateNullable;
            if (this.precision === undefined && options.connection.driver.mappedDataTypes.deleteDatePrecision)
                this.precision = options.connection.driver.mappedDataTypes.deleteDatePrecision;
        }
        if (this.isVersion)
            this.type = options.connection.driver.mappedDataTypes.version;
        if (options.closureType)
            this.closureType = options.closureType;
        if (options.nestedSetLeft)
            this.isNestedSetLeft = options.nestedSetLeft;
        if (options.nestedSetRight)
            this.isNestedSetRight = options.nestedSetRight;
        if (options.materializedPath)
            this.isMaterializedPath = options.materializedPath;
    }

    // ---------------------------------------------------------------------
    // Public Methods
    // ---------------------------------------------------------------------

    /**
     * Creates entity id map from the given entity ids array.
     */
    createValueMap(value: any, useDatabaseName = false) {
        let base: ObjectLiteral = {};
        let map: ObjectLiteral = base;

        // extract column value from embeds of entity if column is in embedded
        if (this.embeddedMetadata) {
            // example: post[data][information][counters].id where "data", "information" and "counters" are embeddeds
            // we need to get value of "id" column from the post real entity object and return it in a
            // { data: { information: { counters: { id: ... } } } } format

            for (const parentPropertyName of this.embeddedMetadata.parentPropertyNames) {
                map[parentPropertyName] = {};
                map = map[parentPropertyName];
            }
        }

        // this is bugfix for #720 when increment number is bigint we need to make sure its a string
        if ((this.generationStrategy === "increment" || this.generationStrategy === "rowid") && this.type === "bigint" && value !== null)
            value = String(value);

        map[useDatabaseName ? this.databaseName : this.propertyName] = value;
        return base;
    }

    /**
     * Extracts column value and returns its column name with this value in a literal object.
     * If column is in embedded (or recursive embedded) it returns complex literal object.
     *
     * Examples what this method can return depend if this column is in embeds.
     * { id: 1 } or { title: "hello" }, { counters: { code: 1 } }, { data: { information: { counters: { code: 1 } } } }
     */
    getEntityValueMap(entity: ObjectLiteral, options?: { skipNulls?: boolean }): ObjectLiteral|undefined {
        const returnNulls = false; // options && options.skipNulls === false ? false : true; // todo: remove if current will not bring problems, uncomment if it will.

        let base: ObjectLiteral = {};
        let map: ObjectLiteral = base;

        // extract column value from embeds of entity if column is in embedded
        if (this.embeddedMetadata) {
            // example: post[data][information][counters].id where "data", "information" and "counters" are embeddeds
            // we need to get value of "id" column from the post real entity object and return it in a
            // { data: { information: { counters: { id: ... } } } } format

            for (const parentPropertyName of this.embeddedMetadata.parentPropertyNames) {
                if (!(entity[parentPropertyName] instanceof Object)) return undefined;
                entity = entity[parentPropertyName];

                map[parentPropertyName] = {};
                map = map[parentPropertyName];
            }
        }

        if (this.relationMetadata && entity[this.propertyName] && entity[this.propertyName] instanceof Object) {
            const joinEntityValueMaps = this.relationMetadata.joinColumns
                .map(joinColumn => joinColumn.referencedColumn!.getEntityValueMap(entity[this.propertyName]))
                .filter(value => value !== undefined);
            if (joinEntityValueMaps.length === 0)
                return undefined;

            map[this.propertyName] = OrmUtils.mergeDeep({}, ...joinEntityValueMaps);
        } else {
            if (entity[this.propertyName] === undefined || (returnNulls && entity[this.propertyName] === null))
                return undefined;
            map[this.propertyName] = entity[this.propertyName];
        }

        return base;
    }

    /**
     * Extracts column value from the given entity.
     * If column is in embedded (or recursive embedded) it extracts its value from there.
     */
    getEntityValue(entity: ObjectLiteral, transform: boolean = false): any|undefined {
        if (entity === null || entity === undefined) return undefined;

        // extract column value from embeddeds of entity if column is in embedded
        if (this.embeddedMetadata) {
            // example: post[data][information][counters].id where "data", "information" and "counters" are embeddeds
            // we need to get value of "id" column from the post real entity object

            // recursively access entity[parentPropertyName] until non-object encountered
            for (const parentPropertyName of this.embeddedMetadata.parentPropertyNames) {
                if (!(entity[parentPropertyName] instanceof Object)) return undefined;
                entity = entity[parentPropertyName];
            }
        }

        let value: any;
        if (this.relationMetadata && this.referencedColumn) {
            const relatedEntity = this.relationMetadata.getEntityValue(entity);
            if (relatedEntity && relatedEntity instanceof Object && !(relatedEntity instanceof ExpressionBuilder) && !(relatedEntity instanceof Function)) {
                value = this.referencedColumn.getEntityValue(relatedEntity);
            } else if (entity[this.relationMetadata.propertyName] && entity[this.relationMetadata.propertyName] instanceof Object && !(entity[this.relationMetadata.propertyName] instanceof ExpressionBuilder) && !(entity[this.relationMetadata.propertyName] instanceof Function)) {
                value = this.referencedColumn.getEntityValue(entity[this.relationMetadata.propertyName]);
            } else {
                value = entity[this.propertyName];
            }
        } else if (this.referencedColumn) {
            value = this.referencedColumn.getEntityValue(entity[this.propertyName]);
        } else {
            value = entity[this.propertyName];
        }

        if (transform && this.transformer)
            value = ApplyValueTransformers.transformTo(this.transformer, value);

        return value;
    }

    /**
     * Sets given entity's column value.
     * Using of this method helps to set entity relation's value of the lazy and non-lazy relations.
     */
    setEntityValue(entity: ObjectLiteral, value: any): void {
        if (this.embeddedMetadata) {
            for (const embeddedMetadata of this.embeddedMetadata.embeddedMetadataTree) {
                if (entity[embeddedMetadata.propertyName] === undefined) {
                    entity[embeddedMetadata.propertyName] = embeddedMetadata.create();
                }

                entity = entity[embeddedMetadata.propertyName];
                // TODO: If entity[embeddedMetadata.propertyName] isn't an object?
            }
        }

        // we write a deep object in this entity only if the column is internal
        // because if its not internal it means the user defined a real column for this relation
        // also we don't do it if column is inside a junction table
        if (!this.entityMetadata.isJunction && this.isInternal && this.referencedColumn && this.referencedColumn.propertyName !== this.propertyName) {
            if (!(this.propertyName in entity)) {
                entity[this.propertyName] = {};
            }

            entity[this.propertyName][this.referencedColumn.propertyName] = value;
        } else {
            entity[this.propertyName] = value;
        }
    }

    // ---------------------------------------------------------------------
    // Builder Methods
    // ---------------------------------------------------------------------

    build(connection: Connection): this {
        this.propertyPath = this.buildPropertyPath();
        this.propertyAliasName = this.propertyPath.replace(".", "_");
        this.databaseName = this.buildDatabaseName(connection);
        this.databasePath = this.buildDatabasePath();
        this.databaseNameWithoutPrefixes = connection.namingStrategy.columnName(this.propertyName, this.givenDatabaseName, []);
        return this;
    }

    protected buildPropertyPath(): string {
        let path = "";
        if (this.embeddedMetadata && this.embeddedMetadata.parentPropertyNames.length)
            path = this.embeddedMetadata.parentPropertyNames.join(".") + ".";

        path += this.propertyName;

        // we add reference column to property path only if this column is internal
        // because if its not internal it means user defined a real column for this relation
        // also we don't do it if column is inside a junction table
        //if (!this.entityMetadata.isJunction && this.isInternal && this.referencedColumn && this.referencedColumn.propertyName !== this.propertyName)
        //    path += "." + this.referencedColumn.propertyName;

        return path;
    }

    protected buildDatabasePath(): string {
        let path = "";
        if (this.embeddedMetadata && this.embeddedMetadata.parentPropertyNames.length)
            path = this.embeddedMetadata.parentPropertyNames.join(".") + ".";

        path += this.databaseName;

        // we add reference column to property path only if this column is internal
        // because if its not internal it means user defined a real column for this relation
        // also we don't do it if column is inside a junction table
        if (!this.entityMetadata.isJunction && this.isInternal && this.referencedColumn && this.referencedColumn.databaseName !== this.databaseName)
            path += "." + this.referencedColumn.databaseName;

        return path;
    }

    protected buildDatabaseName(connection: Connection): string {
        let propertyNames = this.embeddedMetadata ? this.embeddedMetadata.parentPrefixes : [];
        if (connection.driver instanceof MongoDriver) // we don't need to include embedded name for the mongodb column names
            propertyNames = [];
        return connection.namingStrategy.columnName(this.propertyName, this.givenDatabaseName, propertyNames);
    }

}
