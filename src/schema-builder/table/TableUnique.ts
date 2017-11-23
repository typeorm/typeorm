import {TableUniqueOptions} from "../options/TableUniqueOptions";
import {UniqueMetadata} from "../../metadata/UniqueMetadata";

/**
 * Database's table unique constraint stored in this class.
 */
export class TableUnique {

    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * Constraint name.
     */
    name?: string;

    /**
     * Columns that contains this constraint.
     */
    columnNames: string[] = [];

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(options: TableUniqueOptions) {
        this.name = options.name;
        this.columnNames = options.columnNames;
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Creates a new copy of this constraint with exactly same properties.
     */
    clone(): TableUnique {
        return new TableUnique(<TableUniqueOptions>{
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
    static create(uniqueMetadata: UniqueMetadata): TableUnique {
        return new TableUnique(<TableUniqueOptions>{
            name: uniqueMetadata.name,
            columnNames: uniqueMetadata.columns.map(column => column.databaseName)
        });
    }

}