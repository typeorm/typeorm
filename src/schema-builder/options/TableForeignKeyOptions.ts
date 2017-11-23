/**
 * Foreign key options.
 */
export interface TableForeignKeyOptions {

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
    columnNames: string[];

    /**
     * Table referenced in the foreign key.
     */
    referencedTableName: string;

    /**
     * Column names which included by this foreign key.
     */
    referencedColumnNames: string[];

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

}