import { TableIndexTypes } from "../../schema-builder/options/TableIndexTypes"

/**
 * Describes all index options.
 */
export interface IndexOptions {
    /**
     * Indicates if this composite index must be unique or not.
     */
    unique?: boolean

    /**
     * The SPATIAL modifier indexes the entire column and does not allow indexed columns to contain NULL values.
     * Works only in MySQL and PostgreSQL.
     */
    spatial?: boolean

    /**
     * The FULLTEXT modifier indexes the entire column and does not allow prefixing.
     * Works only in MySQL.
     */
    fulltext?: boolean

    /**
     * NULL_FILTERED indexes are particularly useful for indexing sparse columns, where most rows contain a NULL value.
     * In these cases, the NULL_FILTERED index can be considerably smaller and more efficient to maintain than
     * a normal index that includes NULL values.
     *
     * Works only in Spanner.
     */
    nullFiltered?: boolean

    /**
     * Fulltext parser.
     * Works only in MySQL.
     */
    parser?: string

    /**
     * Index filter condition.
     */
    where?: string

    /**
     * If true, the index only references documents with the specified field.
     * These indexes use less space but behave differently in some situations (particularly sorts).
     * This option is only supported for mongodb database.
     */
    sparse?: boolean

    /**
     * Builds the index in the background so that building an index an does not block other database activities.
     * This option is only supported for mongodb database.
     */
    background?: boolean

    /**
     * Create the index using the CONCURRENTLY modifier
     * Works only in postgres.
     */
    concurrent?: boolean

    /**
     * Specifies a time to live, in seconds.
     * This option is only supported for mongodb database.
     */
    expireAfterSeconds?: number

    /**
     * The `type` option defines the type of the index being created.
     * Supported types include B-tree, Hash, GiST, SP-GiST, GIN, and BRIN
     * This option is only applicable in PostgreSQL.
     */
    type?: TableIndexTypes

    /**
     * Specifies the sort order of the index.
     * Works only in PostgreSQL and CockroachDB.
     *
     * For property-level (single-column) indexes, can be used as shorthand:
     * @example
     * ```typescript
     * @Column()
     * @Index("IDX_NAME", { order: "ASC" })
     * name: string
     * ```
     *
     * For multi-column indexes, use columnOptions instead.
     */
    order?: "ASC" | "DESC"

    /**
     * Specifies the nulls ordering of the index.
     * Works only in PostgreSQL and CockroachDB.
     *
     * For property-level (single-column) indexes, can be used as shorthand:
     * @example
     * ```typescript
     * @Column({ nullable: true })
     * @Index("IDX_INFO", { nulls: "NULLS FIRST" })
     * info: string | null
     * ```
     *
     * For multi-column indexes, use columnOptions instead.
     */
    nulls?: "NULLS FIRST" | "NULLS LAST"

    /**
     * Per-column options for the index.
     * Allows specifying sort order (ASC/DESC) and null ordering (NULLS FIRST/NULLS LAST) for each column.
     * Works only in PostgreSQL and CockroachDB.
     *
     * For multi-column indexes (class-level @Index), use column names as keys:
     * @example
     * ```typescript
     * @Index(["firstName", "lastName"], {
     *   columnOptions: {
     *     firstName: { order: "ASC", nulls: "NULLS FIRST" },
     *     lastName: { order: "DESC", nulls: "NULLS LAST" }
     *   }
     * })
     * ```
     */
    columnOptions?: {
        [columnName: string]: {
            order?: "ASC" | "DESC"
            nulls?: "NULLS FIRST" | "NULLS LAST"
        }
    }
}
