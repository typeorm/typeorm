/**
 * Arguments for JoinColumnMetadata class.
 */
export interface JoinColumnMetadataArgs {
    /**
     * Class to which this column is applied.
     */
    target: Function | string

    /**
     * Class's property name to which this column is applied.
     */
    propertyName: string

    /**
     * Name of the column.
     */
    name?: string

    /**
     * Name of the column in the entity to which this column is referenced.
     * This is column property name, not a column database name.
     */
    referencedColumnName?: string

    /**
     * Name of the foreign key constraint.
     */
    foreignKeyConstraintName?: string

    /**
     * When set to true, prevents this column from being renamed if it appears
     * in both joinColumns and inverseJoinColumns of a junction table.
     * This allows shared columns for composite foreign key constraints.
     * By default is false.
     */
    preserveSharedColumn?: boolean
}
