import type { TableUniqueOptions } from "../options/TableUniqueOptions"
import type { UniqueMetadata } from "../../metadata/UniqueMetadata"

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
     * Per-column sort orders for this unique constraint.
     * Columns not listed here use the database default (ASC).
     */
    columnOrders: { [columnName: string]: "ASC" | "DESC" }

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(options: TableUniqueOptions) {
        this.name = options.name
        this.columnNames = options.columnNames
        this.deferrable = options.deferrable
        this.columnOrders = options.columnOrders ?? {}
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
            columnOrders: { ...this.columnOrders },
        })
    }

    // -------------------------------------------------------------------------
    // Static Methods
    // -------------------------------------------------------------------------

    /**
     * Creates unique from the unique metadata object.
     *
     * @param uniqueMetadata
     */
    static create(uniqueMetadata: UniqueMetadata): TableUnique {
        return new TableUnique(<TableUniqueOptions>{
            name: uniqueMetadata.name,
            columnNames: uniqueMetadata.columns.map(
                (column) => column.databaseName,
            ),
            deferrable: uniqueMetadata.deferrable,
            columnOrders: { ...uniqueMetadata.columnOrderMap },
        })
    }
}
