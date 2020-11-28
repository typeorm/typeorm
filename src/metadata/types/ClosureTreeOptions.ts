/**
 * Tree type.
 * Specifies what table pattern will be used for the tree entity.
 */
export interface ClosureTreeOptions {
    closureTableName?: string,
    ancestorColumnName?: string,
    descendantColumnName?: string,
    levelColumnName?: string,
}
