import {IndexMetadata} from "../../metadata/IndexMetadata";
import {TableIndexOptions} from "../options/TableIndexOptions";

/**
 * Database's table index stored in this class.
 */
export class TableIndex {

    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * Index name.
     */
    name?: string;

    /**
     * Columns included in this index.
     */
    columnNames: string[] = [];

    /**
     * Indicates if this index is unique.
     */
    isUnique?: boolean;

    /**
     * Index filter condition.
     */
    where?: string;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(options: TableIndexOptions) {
        this.name = options.name;
        this.columnNames = options.columnNames;
        this.isUnique = options.isUnique;
        this.where = options.where;
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Creates a new copy of this index with exactly same properties.
     */
    clone(): TableIndex {
        return new TableIndex(<TableIndexOptions>{
            name: this.name,
            columnNames: [...this.columnNames],
            isUnique: this.isUnique,
            where: this.where
        });
    }

    // -------------------------------------------------------------------------
    // Static Methods
    // -------------------------------------------------------------------------

    /**
     * Creates index from the index metadata object.
     */
    static create(indexMetadata: IndexMetadata): TableIndex {
        return new TableIndex(<TableIndexOptions>{
            name: indexMetadata.name,
            columnNames: indexMetadata.columns.map(column => column.databaseName),
            isUnique: indexMetadata.isUnique,
            where: indexMetadata.where
        });
    }

}