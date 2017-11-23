import {TableColumnOptions} from "../options/TableColumnOptions";

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
    default?: any;

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

    constructor(options?: TableColumnOptions) {
        if (options) {
            this.name = options.name;
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
        return new TableColumn(<TableColumnOptions>{
            name: this.name,
            type: this.type,
            length: this.length,
            charset: this.charset,
            collation: this.collation,
            precision: this.precision,
            scale: this.scale,
            enum: this.enum,
            default: this.default,
            isNullable: this.isNullable,
            isGenerated: this.isGenerated,
            generationStrategy: this.generationStrategy,
            isPrimary: this.isPrimary,
            isUnique: this.isUnique,
            isArray: this.isArray,
            comment: this.comment
        });
    }

}