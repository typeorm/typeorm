import type { Query } from "./Query"

/**
 * This class stores up and down queries needed for migrations functionality.
 */
export class SqlInMemory {
    upQueries: Query[] = []
    downQueries: Query[] = []

    /**
     * Warnings emitted during schema diff (e.g. refused column changes).
     * Populated when `changeStrategy` is `'alter'` or `'auto'`.
     */
    warnings: string[] = []
}
