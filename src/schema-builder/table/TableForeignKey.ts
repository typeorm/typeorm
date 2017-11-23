import {ForeignKeyMetadata} from "../../metadata/ForeignKeyMetadata";
import {Table} from "./Table";
import {TableForeignKeyOptions} from "../options/TableForeignKeyOptions";

/**
 * Foreign key from the database stored in this class.
 */
export class TableForeignKey {

    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * Name of the table which contains this foreign key.
     */
    name?: string;

    /**
     * Column names which included by this foreign key.
     */
    columnNames: string[] = [];

    /**
     * Table referenced in the foreign key.
     */
    referencedTableName: string;

    /**
     * Column names which included by this foreign key.
     */
    referencedColumnNames: string[] = [];

    /**
     * "ON DELETE" of this foreign key, e.g. what action database should perform when
     * referenced stuff is being deleted.
     */
    onDelete?: string;

    /**
     * "ON UPDATE" of this foreign key, e.g. what action database should perform when
     * referenced stuff is being updated.
     */
    onUpdate?: string;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(options: TableForeignKeyOptions) {
        this.name = options.name;
        this.columnNames = options.columnNames;
        this.referencedColumnNames = options.referencedColumnNames;
        this.referencedTableName = options.referencedTableName;
        this.onDelete = options.onDelete;
        this.onUpdate = options.onUpdate;
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Creates a new copy of this foreign key with exactly same properties.
     */
    clone(): TableForeignKey {
        return new TableForeignKey(<TableForeignKeyOptions>{
            name: this.name,
            columnNames: [...this.columnNames],
            referencedColumnNames: [...this.referencedColumnNames],
            referencedTableName: this.referencedTableName,
            onDelete: this.onDelete,
            onUpdate: this.onUpdate
        });
    }

    // -------------------------------------------------------------------------
    // Static Methods
    // -------------------------------------------------------------------------

    /**
     * Creates a new table foreign key from the given foreign key metadata.
     */
    static create(metadata: ForeignKeyMetadata, table: Table): TableForeignKey {
        return new TableForeignKey(<TableForeignKeyOptions>{
            name: metadata.name,
            columnNames: metadata.columnNames,
            referencedColumnNames: metadata.referencedColumnNames,
            referencedTableName: metadata.referencedTableName,
            onDelete: metadata.onDelete,
            onUpdate: metadata.onUpdate
        });
    }

}