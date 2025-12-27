import { DeferrableType } from "../metadata/types/DeferrableType"

/**
 * Arguments for UniqueMetadata class.
 */
export interface UniqueMetadataArgs {
    /**
     * Class to which index is applied.
     */
    target: Function | string

    /**
     * Unique constraint name.
     */
    name?: string

    /**
     * Columns combination to be unique.
     */
    columns?: ((object?: any) => any[] | { [key: string]: number }) | string[]

    /**
     * Indicate if unique constraints can be deferred.
     */
    deferrable?: DeferrableType

    /**
     * UNIQUE NULLS NOT DISTINCT constraint allows only a single NULL value to appear in a UNIQUE index.
     * This option is only applicable in PostgreSQL.
     */
    nullsNotDistinct?: boolean
}
