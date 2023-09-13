/**
 * Defines a special criteria to find specific entities.
 */
export interface VersioningOptions {
    /**
     * Offset (paginated) where from entities should be taken.
     */
    columnFrom?: string

    /**
     * Limit (paginated) - max number of entities should be taken.
     */
    columnTo?: string
}
