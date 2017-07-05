import {ColumnMetadata} from "../../metadata/ColumnMetadata";
import {Driver} from "../../driver/Driver";

/**
 * Table's column's schema in the database represented in this class.
 */
export class ColumnSchema {

    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * Column name.
     */
    name: string;

    /**
     * Column type.
     */
    type: string;

    /**
     * Column's default value.
     */
    default: any;

    /**
     * Indicates if column is NULL, or is NOT NULL in the database.
     */
    isNullable: boolean = false;

    /**
     * Indicates if column is auto-generated sequence.
     */
    isGenerated: boolean = false;

    /**
     * Indicates if column is a primary key.
     */
    isPrimary: boolean = false;

    /**
     * Indicates if column has unique value.
     */
    isUnique: boolean = false;

    /**
     * Indicates if column stores array.
     */
    isArray: boolean = false;

    /**
     * Column's comment.
     */
    comment?: string;

    /**
     * Column type's length. Used only on some column types.
     * For example type = "string" and length = "100" means that ORM will create a column with type varchar(100).
     */
    length?: number;

    /**
     * The precision for a decimal (exact numeric) column (applies only for decimal column), which is the maximum
     * number of digits that are stored for the values.
     */
    precision?: number;

    /**
     * The scale for a decimal (exact numeric) column (applies only for decimal column), which represents the number
     * of digits to the right of the decimal point and must not be greater than precision.
     */
    scale?: number;

    /**
     * Array of possible enumerated values.
     */
    enum?: any[];

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(options?: {
        name?: string,
        type?: string,
        length?: number,
        precision?: number,
        scale?: number,
        default?: any,
        isNullable?: boolean,
        isGenerated?: boolean,
        isPrimary?: boolean,
        isUnique?: boolean,
        comment?: string,
        enum?: any[]
    }) {
        if (options) {
            this.name = options.name || "";
            this.type = options.type || "";
            this.length = options.length;
            this.precision = options.precision;
            this.scale = options.scale;
            this.default = options.default;
            this.isNullable = options.isNullable || false;
            this.isGenerated = options.isGenerated || false;
            this.isPrimary = options.isPrimary || false;
            this.isUnique = options.isUnique || false;
            this.comment = options.comment;
            this.enum = options.enum;
        }
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Clones this column schema to a new column schema with exact same properties as this column schema has.
     */
    clone(): ColumnSchema {
        const newColumnSchema = new ColumnSchema();
        newColumnSchema.name = this.name;
        newColumnSchema.type = this.type;
        newColumnSchema.length = this.length;
        newColumnSchema.precision = this.precision;
        newColumnSchema.scale = this.scale;
        newColumnSchema.default = this.default;
        newColumnSchema.isNullable = this.isNullable;
        newColumnSchema.isGenerated = this.isGenerated;
        newColumnSchema.isPrimary = this.isPrimary;
        newColumnSchema.isUnique = this.isUnique;
        newColumnSchema.isArray = this.isArray;
        newColumnSchema.comment = this.comment;
        return newColumnSchema;
    }

    getFullType(driver: Driver): string {
        let type = this.type;

        if (this.length) {
            type += "(" + this.length + ")";
        } else if (this.precision && this.scale) {
            type += "(" + this.precision + "," + this.scale + ")";
        } else if (this.precision && this.type !== "real") {
            type +=  "(" + this.precision + ")";
        } else if (this.scale) {
            type +=  "(" + this.scale + ")";
        } else  if (driver.dataTypeDefaults && driver.dataTypeDefaults[this.type] && driver.dataTypeDefaults[this.type].length) {
            type +=  "(" + driver.dataTypeDefaults[this.type].length + ")";
        }

        if (this.isArray)
            type += " array";

        return type;
    }

    // -------------------------------------------------------------------------
    // Static Methods
    // -------------------------------------------------------------------------

    /**
     * Creates a new column based on the given column metadata.
     */
    static create(columnMetadata: ColumnMetadata, normalizedType: string, normalizedDefault: string): ColumnSchema {
        const columnSchema = new ColumnSchema();
        columnSchema.name = columnMetadata.databaseName;
        columnSchema.length = columnMetadata.length;
        columnSchema.precision = columnMetadata.precision;
        columnSchema.scale = columnMetadata.scale;
        columnSchema.default = normalizedDefault;
        columnSchema.comment = columnMetadata.comment;
        columnSchema.isGenerated = columnMetadata.isGenerated;
        columnSchema.isNullable = columnMetadata.isNullable;
        columnSchema.type = normalizedType;
        columnSchema.isPrimary = columnMetadata.isPrimary;
        columnSchema.isUnique = columnMetadata.isUnique;
        columnSchema.isArray = columnMetadata.isArray || false;
        columnSchema.enum = columnMetadata.enum;
        return columnSchema;
    }

}