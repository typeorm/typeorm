/**
 * Database's table index stored in this class.
 */
export class TableIndex {
    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    constructor(options) {
        /**
         * Columns included in this index.
         */
        this.columnNames = [];
        this.name = options.name;
        this.columnNames = options.columnNames;
        this.isUnique = !!options.isUnique;
        this.isSpatial = !!options.isSpatial;
        this.isFulltext = !!options.isFulltext;
        this.parser = options.parser;
        this.where = options.where ? options.where : "";
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    /**
     * Creates a new copy of this index with exactly same properties.
     */
    clone() {
        return new TableIndex({
            name: this.name,
            columnNames: [...this.columnNames],
            isUnique: this.isUnique,
            isSpatial: this.isSpatial,
            isFulltext: this.isFulltext,
            parser: this.parser,
            where: this.where
        });
    }
    // -------------------------------------------------------------------------
    // Static Methods
    // -------------------------------------------------------------------------
    /**
     * Creates index from the index metadata object.
     */
    static create(indexMetadata) {
        return new TableIndex({
            name: indexMetadata.name,
            columnNames: indexMetadata.columns.map(column => column.databaseName),
            isUnique: indexMetadata.isUnique,
            isSpatial: indexMetadata.isSpatial,
            isFulltext: indexMetadata.isFulltext,
            parser: indexMetadata.parser,
            where: indexMetadata.where
        });
    }
}

//# sourceMappingURL=TableIndex.js.map
