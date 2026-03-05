/**
 * Database's table exclusion constraint options.
 */
export interface TableExclusionOptions {
    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * Constraint name.
     */
    name?: string

    /**
     * Exclusion expression.
     */
    expression?: string

    /**
     * Set this exclusion constraint as "DEFERRABLE" e.g. check constraints at start
     * or at the end of a transaction
     */
    deferrable?: string
}
