/**
 * Primary key from the database stored in this class.
 */
export class TablePrimaryKey {

    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * Key name.
     */
    name: string;

    /**
     * Column to which this primary key is bind.
     */
    columnName: string;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(name: string, columnName: string) {
        this.name = name;
        this.columnName = columnName;
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Creates a new copy of this primary key with exactly same properties.
     */
    clone() {
        return new TablePrimaryKey(this.name, this.columnName);
    }

}