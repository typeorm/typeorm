import {IndexMetadata} from "../../metadata/IndexMetadata";

/**
 * Database's table index stored in this class.
 */
export class IndexSchema {

    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * Table name that contains this unique index.
     */
    tableName: string;

    /**
     * Index name.
     */
    name: string;

    /**
     * Columns included in this index.
     */
    columnNames: string[];

    /**
     * Indicates if this index is unique.
     */
    isUnique: boolean;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(tableName: string, name: string, columnNames: string[], isUnique: boolean) {
        this.tableName = tableName;
        this.name = name;
        this.columnNames = columnNames;
        this.isUnique = isUnique;
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Creates a new copy of this index with exactly same properties.
     */
    clone() {
        return new IndexSchema(this.tableName, this.name, this.columnNames.map(name => name), this.isUnique);
    }

    // -------------------------------------------------------------------------
    // Static Methods
    // -------------------------------------------------------------------------

    /**
     * Creates index from the index metadata object.
     */
    static create(indexMetadata: IndexMetadata): IndexSchema {
        return new IndexSchema(
            indexMetadata.entityMetadata.tableName,
            indexMetadata.name,
            indexMetadata.columns.map(column => column.databaseName),
            indexMetadata.isUnique
        );
    }

}