import {ColumnMetadata} from "./ColumnMetadata";
import {EntityMetadata} from "./EntityMetadata";
import {NamingStrategyInterface} from "../naming-strategy/NamingStrategyInterface";
import {OnDeleteType} from "./types/OnDeleteType";

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

    /**
     * Entity metadata which this foreign key references.
     */
    referencedEntityMetadata: EntityMetadata;

    /**
     * Array of columns of this foreign key.
     */
    columns: ColumnMetadata[] = [];

    /**
     * Array of referenced columns.
     */
    referencedColumns: ColumnMetadata[] = [];

    /**
     * What to do with a relation on deletion of the row containing a foreign key.
     */
    onDelete?: OnDeleteType;

    /**
     * Gets the table name to which this foreign key is applied.
     */
    tableName: string;

    /**
     * Gets the table name to which this foreign key is referenced.
     */
    referencedTableName: string;

    /**
     * Gets foreign key name.
     */
    name: string;

    /**
     * Gets array of column names.
     */
    columnNames: string[] = [];

    /**
     * Gets array of referenced column names.
     */
    referencedColumnNames: string[] = [];

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(options: {
        entityMetadata: EntityMetadata,
        referencedEntityMetadata: EntityMetadata,
        namingStrategy?: NamingStrategyInterface,
        columns: ColumnMetadata[],
        referencedColumns: ColumnMetadata[],
        onDelete?: OnDeleteType
    }) {
        this.entityMetadata = options.entityMetadata;
        this.referencedEntityMetadata = options.referencedEntityMetadata;
        this.columns = options.columns;
        this.referencedColumns = options.referencedColumns;
        this.onDelete = options.onDelete;
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
    build(namingStrategy: NamingStrategyInterface) {
        this.columnNames = this.columns.map(column => column.databaseName);
        this.referencedColumnNames = this.referencedColumns.map(column => column.databaseName);
        this.tableName = this.entityMetadata.tableName;
        this.referencedTableName = this.referencedEntityMetadata.tableName;
        this.name = namingStrategy.foreignKeyName(this.tableName, this.columnNames, this.referencedEntityMetadata.tableName, this.referencedColumnNames);
    }

}