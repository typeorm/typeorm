/**
 * Describes join column options.
 */
export interface JoinColumnOptions {
    /**
     * Name of the column.
     */
    name?: string

    /**
     * Name of the column in the entity to which this column is referenced.
     */
    referencedColumnName?: string // TODO rename to referencedColumn

    /**
     * Name of the foreign key constraint.
     */
    foreignKeyConstraintName?: string

    /**
     * When set to true, prevents this column from being renamed if it appears
     * in both joinColumns and inverseJoinColumns of a junction table.
     * This allows shared columns for composite foreign key constraints.
     * By default is false.
     * Only applicable within @JoinTable joinColumns/inverseJoinColumns; ignored on non-junction relations.
     */
    preserveSharedColumn?: boolean
}
