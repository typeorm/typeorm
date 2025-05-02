/**
 * Database's table check constraint options.
 */
export interface TableRowLevelSecurityOptions {
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
    columnNames?: string[]

    /**
     * Check expression.
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
}
