import {ColumnMetadataArgs} from "../metadata-args/ColumnMetadataArgs";
import {ColumnType} from "./types/ColumnTypes";
import {EntityMetadata} from "./EntityMetadata";
import {EmbeddedMetadata} from "./EmbeddedMetadata";
import {RelationMetadata} from "./RelationMetadata";

/**
 * Kinda type of the column. Not a type in the database, but locally used type to determine what kind of column
 * we are working with.
 * For example, "primary" means that it will be a primary column, or "createDate" means that it will create a create
 * date column.
 */
export type ColumnMode = "regular"|"virtual"|"createDate"|"updateDate"|"version"|"treeChildrenCount"|"treeLevel"|"discriminator"|"parentId"|"objectId"|"array";

/**
 * This metadata contains all information about entity's column.
 */
export class ColumnMetadata {

    // ---------------------------------------------------------------------
    // Public Properties
    // ---------------------------------------------------------------------

    /**
     * Entity metadata where this column metadata is.
     */
    entityMetadata: EntityMetadata;

    /**
     * Embedded metadata where this column metadata is.
     */
    embeddedMetadata: EmbeddedMetadata;

    /**
     * If this column is foreign key of some relation then this relation's metadata will be here.
     */
    relationMetadata: RelationMetadata;

    // ---------------------------------------------------------------------
    // Public Readonly Properties
    // ---------------------------------------------------------------------

    /**
     * Target class to which metadata is applied.
     */
    readonly target: Function|string|"__virtual__";

    /**
     * Target's property name to which this metadata is applied.
     */
    readonly propertyName: string;

    /**
     * The real reflected property type.
     */
    // readonly propertyType: string;

    /**
     * The database type of the column.
     */
    readonly type: ColumnType;

    /**
     * Column's mode in which this column is working.
     */
    readonly mode: ColumnMode;

    /**
     * Type's length in the database.
     */
    readonly length: string = "";

    /**
     * Indicates if this column is a primary key.
     */
    readonly isPrimary: boolean = false;

    /**
     * Indicates if this column is generated (auto increment or generated other way).
     */
    readonly isGenerated: boolean = false;

    /**
     * Indicates if value in the database should be unique or not.
     */
    readonly isUnique: boolean = false;

    /**
     * Indicates if column can contain nulls or not.
     */
    readonly isNullable: boolean = false;

    /**
     * Column comment.
     */
    readonly comment: string = "";

    /**
     * Default database value.
     */
    readonly default: any;

    /**
     * The precision for a decimal (exact numeric) column (applies only for decimal column), which is the maximum
     * number of digits that are stored for the values.
     */
    readonly precision: number;

    /**
     * The scale for a decimal (exact numeric) column (applies only for decimal column), which represents the number
     * of digits to the right of the decimal point and must not be greater than precision.
     */
    readonly scale: number;

    /**
     * Indicates if this date column will contain a timezone.
     * Used only for date-typed column types.
     * Note that timezone option is not supported by all databases (only postgres for now).
     */
    readonly timezone: boolean;

    /**
     * Indicates if date object must be stored in given date's timezone.
     * By default date is saved in UTC timezone.
     * Works only with "datetime" columns.
     */
    readonly localTimezone?: boolean;

    // ---------------------------------------------------------------------
    // Private Properties
    // ---------------------------------------------------------------------

    /**
     * Column name to be used in the database.
     */
    private _name: string;

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(args: ColumnMetadataArgs) {
        this.target = args.target;
        this.propertyName = args.propertyName;

        if (args.mode)
            this.mode = args.mode;
        // if (args.propertyType)
        //     this.propertyType = args.propertyType.toLowerCase();
        if (args.options.name)
            this._name = args.options.name;
        if (args.options.type)
            this.type = args.options.type;

        if (args.options.length)
            this.length = String(args.options.length);
        if (args.options.primary)
            this.isPrimary = args.options.primary;
        if (args.options.generated)
            this.isGenerated = args.options.generated;
        if (args.options.unique)
            this.isUnique = args.options.unique;
        if (args.options.nullable)
            this.isNullable = args.options.nullable;
        if (args.options.comment)
            this.comment = args.options.comment;
        if (args.options.default !== undefined && args.options.default !== null)
            this.default = args.options.default;
        if (args.options.scale)
            this.scale = args.options.scale;
        if (args.options.precision)
            this.precision = args.options.precision;
        if (args.options.timezone)
            this.timezone = args.options.timezone;
        if (args.options.localTimezone)
            this.localTimezone = args.options.localTimezone;
    }

    // ---------------------------------------------------------------------
    // Accessors
    // ---------------------------------------------------------------------

    /**
     * Gets column's entity target.
     * Original target returns target of the class where column is.
     * This class can be an abstract class, but column even is from that class,
     * but its more related to a specific entity. That's why we need this field.
     */
    get entityTarget(): Function|string {
        return this.entityMetadata.target;
    }

    /**
     * Column name in the database.
     *
     * todo: rename to originalName
     */
    get name(): string {
        return this.entityMetadata.namingStrategy.columnName(this.propertyName, this._name);
    }

    /**
     * Column name in the database including its embedded prefixes.
     *
     * todo: rename to databaseName
     */
    get fullName(): string {

        // if this column is embedded's column then apply different entity
        if (this.embeddedMetadata) {

            // because embedded can be inside other embedded we need to go recursively and collect all prefix name
            const prefixes: string[] = [];
            const buildPrefixRecursively = (embeddedMetadata: EmbeddedMetadata) => {
                if (embeddedMetadata.parentEmbeddedMetadata)
                    buildPrefixRecursively(embeddedMetadata.parentEmbeddedMetadata);

                prefixes.push(embeddedMetadata.prefix);
            };
            buildPrefixRecursively(this.embeddedMetadata);

            return this.entityMetadata.namingStrategy.embeddedColumnName(prefixes, this.propertyName, this._name);
        }

        // if there is a naming strategy then use it to normalize propertyName as column name
        if (this.entityMetadata)
            return this.entityMetadata.namingStrategy.columnName(this.propertyName, this._name);

        throw new Error(`Column ${this._name ? this._name + " " : ""}is not attached to any entity or embedded.`);
    }

    /**
     * Indicates if this column is in embedded, not directly in the table.
     */
    get isInEmbedded(): boolean {
        return !!this.embeddedMetadata;
    }

    /**
     * Indicates if column is virtual. Virtual columns are not mapped to the entity.
     */
    get isVirtual() {
        return this.mode === "virtual";
    }

    /**
     * Indicates if column is array.
     * Array columns are now only supported by Mongodb driver.
     *
     * todo: implement array serialization functionality for relational databases as well
     */
    get isArray() {
        return this.mode === "array";
    }

    /**
     * Indicates if column is a parent id. Parent id columns are not mapped to the entity.
     */
    get isParentId() {
        return this.mode === "parentId";
    }

    /**
     * Indicates if column is discriminator. Discriminator columns are not mapped to the entity.
     */
    get isDiscriminator() {
        return this.mode === "discriminator";
    }

    /**
     * Indicates if this column contains an entity creation date.
     */
    get isCreateDate() {
        return this.mode === "createDate";
    }

    /**
     * Indicates if this column contains an entity update date.
     */
    get isUpdateDate() {
        return this.mode === "updateDate";
    }

    /**
     * Indicates if this column contains an entity version.
     */
    get isVersion() {
        return this.mode === "version";
    }

    /**
     * Indicates if this column contains an object id.
     */
    get isObjectId() {
        return this.mode === "objectId";
    }

    /**
     * If this column references some column, it gets the first referenced column of this column.
     */
    get referencedColumn(): ColumnMetadata|undefined {
        const foreignKey = this.entityMetadata.foreignKeys.find(foreignKey => foreignKey.columns.indexOf(this) !== -1);
        if (foreignKey) {
            return foreignKey.referencedColumns[0];
        }

        return undefined;
    }

    /**
     * Gets embedded property in which column is.
     */
    get embeddedProperty() {
        if (!this.embeddedMetadata)
            throw new Error(`This column${ this._name ? this._name + " " : "" } is not in embedded entity.`);

        return this.embeddedMetadata.propertyName;
    }

    // ---------------------------------------------------------------------
    // Public Methods
    // ---------------------------------------------------------------------

    hasEntityValue(entity: any) {
        if (!entity)
            return false;

        if (this.isInEmbedded) {
            return  entity[this.embeddedProperty] !== undefined &&
                    entity[this.embeddedProperty] !== null &&
                    entity[this.embeddedProperty][this.propertyName] !== undefined &&
                    entity[this.embeddedProperty][this.propertyName] !== null;

        } else {
            return  entity[this.propertyName] !== undefined &&
                    entity[this.propertyName] !== null;
        }
    }

    getEntityValue(entity: any) {
        if (this.isInEmbedded) {
            if (entity[this.embeddedProperty] === undefined ||
                entity[this.embeddedProperty] === null)
                return undefined;

            return entity[this.embeddedProperty][this.propertyName];
        } else {
            return entity[this.propertyName];
        }
    }

}