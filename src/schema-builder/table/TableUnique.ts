import { TableUniqueOptions } from "../options/TableUniqueOptions"
import { UniqueMetadata } from "../../metadata/UniqueMetadata"

/**
 * Database's table unique constraint stored in this class.
 */
export class TableUnique {
    readonly "@instanceof" = Symbol.for("TableUnique")

    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * Constraint name.
     */
    name?: string

    /**
     * Columns that contains this constraint.
     */
    columnNames: string[] = []

    /**
     * Set this foreign key constraint as "DEFERRABLE" e.g. check constraints at start
     * or at the end of a transaction
     */
    deferrable?: string

    /**
     * UNIQUE NULLS NOT DISTINCT constraint allows only a single NULL value to appear in a UNIQUE index.
     * This option is only applicable in PostgreSQL.
     */
    isNullsNotDistinct: boolean

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(options: TableUniqueOptions) {
        this.name = options.name
        this.columnNames = options.columnNames
        this.deferrable = options.deferrable
        this.isNullsNotDistinct = !!options.isNullsNotDistinct
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
            columnNames: [...this.columnNames],
            deferrable: this.deferrable,
            isNullsNotDistinct: this.isNullsNotDistinct,
        })
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
            columnNames: uniqueMetadata.columns.map(
                (column) => column.databaseName,
            ),
            deferrable: uniqueMetadata.deferrable,
            isNullsNotDistinct: uniqueMetadata.nullsNotDistinct,
        })
    }
}
