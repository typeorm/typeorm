/**
 * Contains all information about entity's foreign key.
 */
export class ForeignKeyMetadata {
    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------
    constructor(options) {
        /**
         * Array of columns of this foreign key.
         */
        this.columns = [];
        /**
         * Array of referenced columns.
         */
        this.referencedColumns = [];
        /**
         * Gets array of column names.
         */
        this.columnNames = [];
        /**
         * Gets array of referenced column names.
         */
        this.referencedColumnNames = [];
        this.entityMetadata = options.entityMetadata;
        this.referencedEntityMetadata = options.referencedEntityMetadata;
        this.columns = options.columns;
        this.referencedColumns = options.referencedColumns;
        this.onDelete = options.onDelete || "NO ACTION";
        this.onUpdate = options.onUpdate || "NO ACTION";
        this.deferrable = options.deferrable;
        if (options.namingStrategy)
            this.build(options.namingStrategy);
    }
    // ---------------------------------------------------------------------
    // Public Methods
    // ---------------------------------------------------------------------
    /**
     * Builds some depend foreign key properties.
     * Must be called after all entity metadatas and their columns are built.
     */
    build(namingStrategy) {
        this.columnNames = this.columns.map(column => column.databaseName);
        this.referencedColumnNames = this.referencedColumns.map(column => column.databaseName);
        this.referencedTablePath = this.referencedEntityMetadata.tablePath;
        this.name = namingStrategy.foreignKeyName(this.entityMetadata.tablePath, this.columnNames, this.referencedTablePath, this.referencedColumnNames);
    }
}

//# sourceMappingURL=ForeignKeyMetadata.js.map
