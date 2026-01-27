import { DeferrableType } from "../metadata/types/DeferrableType"

export interface EntitySchemaUniqueOptions {
    /**
     * Unique constraint name.
     */
    name?: string

    /**
     * Unique column names.
     */
    columns?: ((object?: any) => any[] | { [key: string]: number }) | string[]

    /**
     * Indicate if unique constraints can be deferred.
     */
    deferrable?: DeferrableType

    /**
     * UNIQUE NULLS NOT DISTINCT constraint allows only a single NULL value to appear in a UNIQUE index.
     * Works only in PostgreSQL.
     */
    nullsNotDistinct?: boolean
}
