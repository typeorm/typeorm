/**
 * Database's table unique constraint stored in this class.
 */
export class TableUnique {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    constructor(options) {
        /**
         * Columns that contains this constraint.
         */
        this.columnNames = [];
        this.name = options.name;
        this.columnNames = options.columnNames;
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Creates a new copy of this constraint with exactly same properties.
     */
    clone() {
        return new TableUnique({
            name: this.name,
            columnNames: [...this.columnNames]
        });
    }
    // -------------------------------------------------------------------------
    // Static Methods
    // -------------------------------------------------------------------------
    /**
     * Creates unique from the unique metadata object.
     */
    static create(uniqueMetadata) {
        return new TableUnique({
            name: uniqueMetadata.name,
            columnNames: uniqueMetadata.columns.map(column => column.databaseName)
        });
    }
}

//# sourceMappingURL=TableUnique.js.map
