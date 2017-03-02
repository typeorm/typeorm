import {ColumnMetadata} from "../../metadata/ColumnMetadata";

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
     * Column's comment.
     */
    comment: string|undefined;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(options?: {
        name?: string,
        type?: string,
        default?: string,
        isNullable?: boolean,
        isGenerated?: boolean,
        isPrimary?: boolean,
        isUnique?: boolean,
        comment?: string
    }) {
        if (options) {
            this.name = options.name || "";
            this.type = options.type || "";
            this.default = options.default;
            this.isNullable = options.isNullable || false;
            this.isGenerated = options.isGenerated || false;
            this.isPrimary = options.isPrimary || false;
            this.isUnique = options.isUnique || false;
            this.comment = options.comment;
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
        newColumnSchema.default = this.default;
        newColumnSchema.isNullable = this.isNullable;
        newColumnSchema.isGenerated = this.isGenerated;
        newColumnSchema.isPrimary = this.isPrimary;
        newColumnSchema.isUnique = this.isUnique;
        newColumnSchema.comment = this.comment;
        return newColumnSchema;
    }

    // -------------------------------------------------------------------------
    // Static Methods
    // -------------------------------------------------------------------------

    /**
     * Creates a new column based on the given column metadata.
     */
    static create(columnMetadata: ColumnMetadata, normalizedType: string): ColumnSchema {
        const columnSchema = new ColumnSchema();
        columnSchema.name = columnMetadata.fullName;
        columnSchema.default = columnMetadata.default;
        columnSchema.comment = columnMetadata.comment;
        columnSchema.isGenerated = columnMetadata.isGenerated;
        columnSchema.isNullable = columnMetadata.isNullable;
        columnSchema.type = normalizedType;
        columnSchema.isPrimary = columnMetadata.isPrimary;
        columnSchema.isUnique = columnMetadata.isUnique;
        return columnSchema;
    }

}