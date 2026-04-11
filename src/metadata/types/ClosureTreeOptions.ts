/**
 * Tree type.
 * Specifies what table pattern will be used for the tree entity.
 */
import type { ColumnMetadata } from "../ColumnMetadata"

export interface ClosureTreeOptions {
    closureTableName?: string
    ancestorColumnName?: (column: ColumnMetadata) => string
    descendantColumnName?: (column: ColumnMetadata) => string
}
