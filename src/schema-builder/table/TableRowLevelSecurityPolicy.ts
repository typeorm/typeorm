import { TableCheckOptions } from "../options/TableCheckOptions"
import { RowLevelSecurityMetadata } from "../../metadata/RowLevelSecurityMetadata"
import { TableRowLevelSecurityOptions } from "../options/TableRowLevelSecurityOptions"

/**
 * Database's table check constraint stored in this class.
 */
export class TableRowLevelSecurityPolicy {
    readonly "@instanceof" = Symbol.for("TableRowLevelSecurityPolicy")

    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * Constraint name.
     */
    name?: string

    /**
     * Column that contains this constraint.
     */
    columnNames?: string[] = []

    /**
     *  RLS expression
     */
    expression?: string

    /**
     * Type of the row level security policy.
     */
    type?: "permissive" | "restrictive"

    /**
     * Role to which this row level security policy is applied.
     */
    role?: string

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(options: TableRowLevelSecurityOptions) {
        this.name = options.name
        this.columnNames = options.columnNames
        this.expression = options.expression
        this.type = options.type
        this.role = options.role
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Creates a new copy of this constraint with exactly same properties.
     */
    clone(): TableRowLevelSecurityPolicy {
        return new TableRowLevelSecurityPolicy(<TableRowLevelSecurityOptions>{
            name: this.name,
            columnNames: this.columnNames ? [...this.columnNames] : [],
            expression: this.expression,
            type: this.type,
            role: this.role,
        })
    }

    // -------------------------------------------------------------------------
    // Static Methods
    // -------------------------------------------------------------------------

    /**
     * Creates checks from the check metadata object.
     */
    static create(
        rowLevelSecurityMetadata: RowLevelSecurityMetadata,
    ): TableRowLevelSecurityPolicy {
        return new TableRowLevelSecurityPolicy(<TableRowLevelSecurityOptions>{
            name: rowLevelSecurityMetadata.name,
            expression: rowLevelSecurityMetadata.expression,
            type: rowLevelSecurityMetadata.type,
            role: rowLevelSecurityMetadata.role,
        })
    }
}
