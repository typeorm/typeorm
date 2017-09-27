import {ColumnMetadata} from "../../metadata/ColumnMetadata";

/**
 * Table's columns in the database represented in this class.
 */
export class TableColumn {

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
     * Specifies generation strategy if this column will use auto increment.
     */
    generationStrategy?: "uuid"|"increment";

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
    length: string = "";

    /**
     * Defines column character set.
     */
    charset?: string;

    /**
     * Defines column collation.
     */
    collation?: string;

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
        length?: string,
        charset?: string,
        collation?: string,
        precision?: number,
        scale?: number,
        default?: any,
        isNullable?: boolean,
        isGenerated?: boolean,
        generationStrategy?: "uuid"|"increment",
        isPrimary?: boolean,
        isUnique?: boolean,
        comment?: string,
        enum?: any[]
    }) {
        if (options) {
            this.name = options.name || "";
            this.type = options.type || "";
            this.length = options.length || "";
            this.charset = options.charset;
            this.collation = options.collation;
            this.precision = options.precision;
            this.scale = options.scale;
            this.default = options.default;
            this.isNullable = options.isNullable || false;
            this.isGenerated = options.isGenerated || false;
            this.generationStrategy = options.generationStrategy;
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
     * Clones this column to a new column with exact same properties as this column has.
     */
    clone(): TableColumn {
        const newTableColumn = new TableColumn();
        newTableColumn.name = this.name;
        newTableColumn.type = this.type;
        newTableColumn.length = this.length;
        newTableColumn.charset = this.charset;
        newTableColumn.collation = this.collation;
        newTableColumn.precision = this.precision;
        newTableColumn.scale = this.scale;
        newTableColumn.enum = this.enum;
        newTableColumn.default = this.default;
        newTableColumn.isNullable = this.isNullable;
        newTableColumn.isGenerated = this.isGenerated;
        newTableColumn.generationStrategy = this.generationStrategy;
        newTableColumn.isPrimary = this.isPrimary;
        newTableColumn.isUnique = this.isUnique;
        newTableColumn.isArray = this.isArray;
        newTableColumn.comment = this.comment;
        return newTableColumn;
    }

    // -------------------------------------------------------------------------
    // Static Methods
    // -------------------------------------------------------------------------

    /**
     * Creates a new column based on the given column metadata.
     */
    static create(columnMetadata: ColumnMetadata, normalizedType: string, normalizedDefault: string, normalizedLength: string): TableColumn {
        const tableColumn = new TableColumn();
        tableColumn.name = columnMetadata.databaseName;
        tableColumn.length = normalizedLength;
        tableColumn.charset = columnMetadata.charset;
        tableColumn.collation = columnMetadata.collation;
        tableColumn.precision = columnMetadata.precision;
        tableColumn.scale = columnMetadata.scale;
        tableColumn.default = normalizedDefault;
        tableColumn.comment = columnMetadata.comment;
        tableColumn.isGenerated = columnMetadata.isGenerated;
        tableColumn.generationStrategy = columnMetadata.generationStrategy;
        tableColumn.isNullable = columnMetadata.isNullable;
        tableColumn.type = normalizedType;
        tableColumn.isPrimary = columnMetadata.isPrimary;
        tableColumn.isUnique = columnMetadata.isUnique;
        tableColumn.isArray = columnMetadata.isArray || false;
        tableColumn.enum = columnMetadata.enum;
        return tableColumn;
    }

}