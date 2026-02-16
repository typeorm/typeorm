/**
 * Driver capabilities declaration.
 * Replaces hardcoded family checks with explicit feature flags.
 */
export interface DriverCapabilities {
    // =========================================================================
    // DIALECT SYNTAX CAPABILITIES
    // These replace the "what SQL syntax does this use?" family checks
    // =========================================================================

    /**
     * String aggregation function style
     * - 'GROUP_CONCAT': MySQL/MariaDB - GROUP_CONCAT(col SEPARATOR ',')
     * - 'STRING_AGG': Postgres/MSSQL - STRING_AGG(col, ',')
     * - 'LISTAGG': Oracle - LISTAGG(col, ',')
     *
     * Replaces: isMySQLFamily check in SelectQueryBuilder for GROUP_CONCAT
     */
    stringAggregation?: "GROUP_CONCAT" | "STRING_AGG" | "LISTAGG" | null

    /**
     * Pagination clause style
     * - 'LIMIT_OFFSET': MySQL, Postgres, SQLite - LIMIT x OFFSET y
     * - 'TOP': MSSQL legacy - SELECT TOP x
     * - 'FETCH_FIRST': MSSQL 2012+, Oracle 12c+ - OFFSET x ROWS FETCH NEXT y ROWS ONLY
     * - 'ROWNUM': Oracle legacy - WHERE ROWNUM <= x
     *
     * Replaces: Multiple family checks in SelectQueryBuilder pagination logic
     */
    pagination?: "LIMIT_OFFSET" | "TOP" | "FETCH_FIRST" | "ROWNUM"

    /**
     * Supports USE INDEX / FORCE INDEX hints
     *
     * Replaces: isMySQLFamily check in SelectQueryBuilder.buildSelectQuery
     */
    useIndexHint?: boolean

    /**
     * Supports MAX_EXECUTION_TIME query hint
     *
     * Replaces: isMySQLFamily check in SelectQueryBuilder.buildSelectQuery
     */
    maxExecutionTimeHint?: boolean

    /**
     * Supports DISTINCT ON (col1, col2) syntax
     *
     * Replaces: isPostgresFamily check in SelectQueryBuilder
     */
    distinctOn?: boolean

    // =========================================================================
    // UPSERT CAPABILITIES
    // These replace upsert-related family checks
    // =========================================================================

    /**
     * Upsert syntax style
     * - 'ON_CONFLICT': Postgres, SQLite - ON CONFLICT (cols) DO UPDATE
     * - 'ON_DUPLICATE_KEY': MySQL - ON DUPLICATE KEY UPDATE
     * - 'MERGE_INTO': MSSQL, Oracle, SAP - MERGE INTO ... WHEN MATCHED
     *
     * Replaces: Family checks + supportedUpsertTypes throughout InsertQueryBuilder
     */
    upsertStyle?: "ON_CONFLICT" | "ON_DUPLICATE_KEY" | "MERGE_INTO" | null

    /**
     * ON CONFLICT supports WHERE clause for partial indexes
     *
     * Replaces: isPostgresFamily check in InsertQueryBuilder conflict handling
     */
    upsertConflictWhere?: boolean

    // =========================================================================
    // RETURNING/OUTPUT CAPABILITIES
    // These replace RETURNING-related checks
    // =========================================================================

    /**
     * Supports RETURNING clause for INSERT
     */
    returningInsert?: boolean

    /**
     * Supports RETURNING clause for UPDATE
     */
    returningUpdate?: boolean

    /**
     * Supports RETURNING clause for DELETE
     */
    returningDelete?: boolean

    /**
     * RETURNING syntax style
     * - 'RETURNING': Postgres, Oracle (at end of statement)
     * - 'OUTPUT': MSSQL (inline, with INSERTED./DELETED. prefix)
     */
    returningStyle?: "RETURNING" | "OUTPUT" | null

    /**
     * RETURNING requires INTO clause with bind variables (Oracle)
     */
    returningRequiresInto?: boolean

    // =========================================================================
    // UPDATE/DELETE MODIFIER CAPABILITIES
    // =========================================================================

    /**
     * Supports LIMIT clause in UPDATE statements
     *
     * Replaces: isMySQLFamily check in UpdateQueryBuilder/SoftDeleteQueryBuilder
     */
    limitInUpdate?: boolean

    /**
     * Supports LIMIT clause in DELETE statements
     *
     * Replaces: isMySQLFamily check in DeleteQueryBuilder
     */
    limitInDelete?: boolean

    /**
     * Supports JOIN in UPDATE statements
     *
     * Replaces: Various family checks in UpdateQueryBuilder
     */
    joinInUpdate?: boolean

    // =========================================================================
    // LOCKING CAPABILITIES
    // These replace locking-related family checks
    // =========================================================================

    /**
     * Supports FOR UPDATE locking
     */
    forUpdate?: boolean

    /**
     * FOR SHARE syntax style
     * - 'FOR_SHARE': Postgres - FOR SHARE
     * - 'LOCK_IN_SHARE_MODE': MySQL - LOCK IN SHARE MODE
     *
     * Replaces: isPostgresFamily/isMySQLFamily checks in SelectQueryBuilder locking
     */
    forShareStyle?: "FOR_SHARE" | "LOCK_IN_SHARE_MODE" | null

    /**
     * Supports FOR KEY SHARE (Postgres-specific)
     */
    forKeyShare?: boolean

    /**
     * Supports FOR NO KEY UPDATE (Postgres-specific)
     */
    forNoKeyUpdate?: boolean

    /**
     * Supports SKIP LOCKED modifier
     *
     * Replaces: isPostgresFamily/isMySQLFamily checks for pessimistic_partial_write
     */
    skipLocked?: boolean

    /**
     * Supports NOWAIT modifier
     *
     * Replaces: isPostgresFamily/isMySQLFamily checks for pessimistic_write_or_fail
     */
    nowait?: boolean

    /**
     * Supports OF table_name in locking clause
     *
     * Replaces: isPostgresFamily check for lock tables
     */
    lockOfTables?: boolean

    // =========================================================================
    // CTE CAPABILITIES (extends existing CteCapabilities)
    // =========================================================================

    /**
     * CTE (WITH clause) support
     */
    cteEnabled?: boolean

    /**
     * Supports recursive CTEs
     */
    cteRecursive?: boolean

    /**
     * Requires RECURSIVE keyword for recursive CTEs
     */
    cteRequiresRecursiveKeyword?: boolean

    /**
     * Supports writable CTEs (INSERT/UPDATE/DELETE in CTE)
     */
    cteWritable?: boolean

    /**
     * Supports MATERIALIZED hint
     */
    cteMaterializedHint?: boolean

    // =========================================================================
    // DDL CAPABILITIES
    // =========================================================================

    /**
     * Supported index types for this driver
     */
    indexTypes?: string[]

    /**
     * Default index type when not specified
     */
    defaultIndexType?: string

    /**
     * Supports partial/filtered indexes (WHERE clause)
     */
    partialIndexes?: boolean

    /**
     * Supports expression/functional indexes
     */
    expressionIndexes?: boolean

    // =========================================================================
    // COLUMN TYPE CAPABILITIES
    // =========================================================================

    /**
     * Uses variable-length column sizes (requires length for varchar, etc.)
     *
     * Replaces: isMySQLFamily checks in metadata builders for column length
     */
    requiresColumnLength?: boolean

    /**
     * Supports native JSON column type
     */
    jsonColumnType?: boolean

    /**
     * Supports native UUID column type
     */
    uuidColumnType?: boolean

    /**
     * Supports native array column types
     */
    arrayColumnType?: boolean

    // =========================================================================
    // TRANSACTION CAPABILITIES
    // =========================================================================

    /**
     * Transaction support level
     * - 'nested': Full savepoint support
     * - 'simple': Basic transactions, no savepoints
     * - 'none': No transaction support
     */
    transactionSupport?: "nested" | "simple" | "none"
}
