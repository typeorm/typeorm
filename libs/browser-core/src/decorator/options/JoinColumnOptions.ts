/**
 * Describes join column options.
 */
export interface JoinColumnOptions {

    /**
     * Name of the column.
     */
    name?: string;

    /**
     * Name of the column in the entity to which this column is referenced.
     */
    referencedColumnName?: string; // TODO rename to referencedColumn

}
