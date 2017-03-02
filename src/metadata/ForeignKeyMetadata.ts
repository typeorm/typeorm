import {ColumnMetadata} from "./ColumnMetadata";
import {TableMetadata} from "./TableMetadata";
import {EntityMetadata} from "./EntityMetadata";

/**
 * ON_DELETE type to be used to specify delete strategy when some relation is being deleted from the database.
 */
export type OnDeleteType = "RESTRICT"|"CASCADE"|"SET NULL";

/**
 * Contains all information about entity's foreign key.
 */
export class ForeignKeyMetadata {

    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * Entity metadata where this foreign key is.
     */
    entityMetadata: EntityMetadata;

    // -------------------------------------------------------------------------
    // Public Readonly Properties
    // -------------------------------------------------------------------------

    /**
     * Array of columns of this foreign key.
     */
    readonly columns: ColumnMetadata[];

    /**
     * Table to which this foreign key is references.
     */
    readonly referencedTable: TableMetadata;

    /**
     * Array of referenced columns.
     */
    readonly referencedColumns: ColumnMetadata[];

    /**
     * What to do with a relation on deletion of the row containing a foreign key.
     */
    readonly onDelete: OnDeleteType;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(columns: ColumnMetadata[],
                referencedTable: TableMetadata,
                referencedColumns: ColumnMetadata[],
                onDelete?: OnDeleteType) {
        this.columns = columns;
        this.referencedTable = referencedTable;
        this.referencedColumns = referencedColumns;
        if (onDelete)
            this.onDelete = onDelete;
    }

    // -------------------------------------------------------------------------
    // Accessors
    // -------------------------------------------------------------------------

    /**
     * Gets the table name to which this foreign key is applied.
     */
    get tableName() {
        return this.entityMetadata.table.name;
    }

    /**
     * Gets the table name to which this foreign key is referenced.
     */
    get referencedTableName() {
        return this.referencedTable.name;
    }

    /**
     * Gets foreign key name.
     */
    get name() {
        return this.entityMetadata.namingStrategy.foreignKeyName(this.tableName, this.columnNames, this.referencedTable.name, this.referencedColumnNames);
    }

    /**
     * Gets array of column names.
     */
    get columnNames(): string[] {
        return this.columns.map(column => column.fullName);
    }

    /**
     * Gets array of referenced column names.
     */
    get referencedColumnNames(): string[] {
        return this.referencedColumns.map(column => column.fullName);
    }

}