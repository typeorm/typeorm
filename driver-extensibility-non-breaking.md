# TypeORM Driver Extensibility - Removing Family Checks

This document describes how to:

1. **Remove** `isMySQLFamily()`, `isPostgresFamily()`, `isSQLiteFamily()` entirely
2. **Replace** with fine-grained capability checks
3. **Enable** custom driver registration without modifying TypeORM core

---

## Strategy Overview

1. **Remove family methods** - Delete `is*Family()` from DriverUtils
2. **Add capability declarations** - Every driver declares what it supports
3. **Replace all call sites** - Use specific capability checks instead of family checks
4. **Registry for custom drivers** - External drivers register without touching core

---

## Step 1: Comprehensive Capabilities Interface

The key insight: **replace "is this MySQL?" with "does this support X?"**

Each capability flag maps to a specific behavior that family checks currently test for.

```typescript
// src/driver/types/DriverCapabilities.ts (NEW FILE)

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
```

---

## Step 2: Add Required Capabilities Property to Driver Interface

```typescript
// src/driver/Driver.ts - ADD required property

export interface Driver {
    // ... all existing properties unchanged ...

    /**
     * Driver capabilities declaration.
     * Used for feature detection instead of type/family checks.
     * @since 0.4.0 (or next version)
     */
    capabilities: DriverCapabilities
}
```

**Why required?** Since we're removing `is*Family()` methods, all drivers MUST declare their capabilities. This is enforced at compile time.

---

## Step 3: Replace DriverUtils Family Methods with Capability Checks

**Key change:** Remove `is*Family()` methods entirely. Replace with specific capability checks.

```typescript
// src/driver/DriverUtils.ts - REMOVE is*Family, ADD capability methods

export class DriverUtils {
    // =========================================================================
    // CAPABILITY-BASED HELPER METHODS
    // These replace all is*Family checks with specific feature detection
    // =========================================================================

    /**
     * Check if driver supports USE INDEX hint
     */
    static supportsUseIndexHint(driver: Driver): boolean {
        return driver.capabilities.useIndexHint === true
    }

    /**
     * Check if driver supports MAX_EXECUTION_TIME hint
     */
    static supportsMaxExecutionTimeHint(driver: Driver): boolean {
        return driver.capabilities.maxExecutionTimeHint === true
    }

    /**
     * Check if driver supports DISTINCT ON syntax
     */
    static supportsDistinctOn(driver: Driver): boolean {
        return driver.capabilities.distinctOn === true
    }

    /**
     * Get the string aggregation function style
     */
    static getStringAggregationStyle(
        driver: Driver,
    ): "GROUP_CONCAT" | "STRING_AGG" | "LISTAGG" | null {
        return driver.capabilities.stringAggregation ?? null
    }

    /**
     * Get the pagination style
     */
    static getPaginationStyle(
        driver: Driver,
    ): "LIMIT_OFFSET" | "TOP" | "FETCH_FIRST" | "ROWNUM" {
        return driver.capabilities.pagination ?? "LIMIT_OFFSET"
    }

    /**
     * Get the upsert style for this driver
     */
    static getUpsertStyle(
        driver: Driver,
    ): "ON_CONFLICT" | "ON_DUPLICATE_KEY" | "MERGE_INTO" | null {
        return driver.capabilities.upsertStyle ?? null
    }

    /**
     * Check if driver supports WHERE clause in ON CONFLICT
     */
    static supportsUpsertConflictWhere(driver: Driver): boolean {
        return driver.capabilities.upsertConflictWhere === true
    }

    /**
     * Check if driver supports RETURNING for a specific operation
     */
    static supportsReturning(
        driver: Driver,
        operation: "insert" | "update" | "delete",
    ): boolean {
        switch (operation) {
            case "insert":
                return driver.capabilities.returningInsert === true
            case "update":
                return driver.capabilities.returningUpdate === true
            case "delete":
                return driver.capabilities.returningDelete === true
        }
    }

    /**
     * Get the RETURNING clause style
     */
    static getReturningStyle(driver: Driver): "RETURNING" | "OUTPUT" | null {
        return driver.capabilities.returningStyle ?? null
    }

    /**
     * Check if RETURNING requires INTO clause (Oracle)
     */
    static returningRequiresInto(driver: Driver): boolean {
        return driver.capabilities.returningRequiresInto === true
    }

    /**
     * Check if driver supports LIMIT in UPDATE
     */
    static supportsLimitInUpdate(driver: Driver): boolean {
        return driver.capabilities.limitInUpdate === true
    }

    /**
     * Check if driver supports LIMIT in DELETE
     */
    static supportsLimitInDelete(driver: Driver): boolean {
        return driver.capabilities.limitInDelete === true
    }

    /**
     * Check if driver supports JOIN in UPDATE
     */
    static supportsJoinInUpdate(driver: Driver): boolean {
        return driver.capabilities.joinInUpdate === true
    }

    /**
     * Check if driver supports FOR UPDATE
     */
    static supportsForUpdate(driver: Driver): boolean {
        return driver.capabilities.forUpdate === true
    }

    /**
     * Get the FOR SHARE locking style
     */
    static getForShareStyle(
        driver: Driver,
    ): "FOR_SHARE" | "LOCK_IN_SHARE_MODE" | null {
        return driver.capabilities.forShareStyle ?? null
    }

    /**
     * Check if driver supports FOR KEY SHARE (Postgres)
     */
    static supportsForKeyShare(driver: Driver): boolean {
        return driver.capabilities.forKeyShare === true
    }

    /**
     * Check if driver supports FOR NO KEY UPDATE (Postgres)
     */
    static supportsForNoKeyUpdate(driver: Driver): boolean {
        return driver.capabilities.forNoKeyUpdate === true
    }

    /**
     * Check if driver supports SKIP LOCKED
     */
    static supportsSkipLocked(driver: Driver): boolean {
        return driver.capabilities.skipLocked === true
    }

    /**
     * Check if driver supports NOWAIT
     */
    static supportsNowait(driver: Driver): boolean {
        return driver.capabilities.nowait === true
    }

    /**
     * Check if driver supports OF table_name in locking
     */
    static supportsLockOfTables(driver: Driver): boolean {
        return driver.capabilities.lockOfTables === true
    }

    /**
     * Check if columns require explicit length (e.g., VARCHAR(255))
     */
    static requiresColumnLength(driver: Driver): boolean {
        return driver.capabilities.requiresColumnLength === true
    }

    /**
     * Get supported index types
     */
    static getSupportedIndexTypes(driver: Driver): string[] {
        return driver.capabilities.indexTypes ?? []
    }

    /**
     * Get default index type
     */
    static getDefaultIndexType(driver: Driver): string | undefined {
        return driver.capabilities.defaultIndexType
    }

    /**
     * Check if driver supports partial indexes
     */
    static supportsPartialIndexes(driver: Driver): boolean {
        return driver.capabilities.partialIndexes === true
    }

    /**
     * Check if driver supports expression indexes
     */
    static supportsExpressionIndexes(driver: Driver): boolean {
        return driver.capabilities.expressionIndexes === true
    }

    /**
     * Get transaction support level
     */
    static getTransactionSupport(driver: Driver): "nested" | "simple" | "none" {
        return driver.capabilities.transactionSupport ?? "none"
    }

    /**
     * Check if driver supports CTEs
     */
    static supportsCte(driver: Driver): boolean {
        return driver.capabilities.cteEnabled === true
    }

    /**
     * Check if driver supports recursive CTEs
     */
    static supportsRecursiveCte(driver: Driver): boolean {
        return driver.capabilities.cteRecursive === true
    }

    /**
     * Check if driver supports writable CTEs
     */
    static supportsWritableCte(driver: Driver): boolean {
        return driver.capabilities.cteWritable === true
    }

    // =========================================================================
    // REMOVED: is*Family methods
    // These are completely removed - use specific capability checks instead
    // =========================================================================

    // DELETED: isSQLiteFamily()
    // DELETED: isMySQLFamily()
    // DELETED: isPostgresFamily()

    // ... rest of existing methods unchanged (buildDriverOptions, buildAlias, etc.) ...
}
```

---

## Step 4: Add Driver Registry (Alongside Existing Factory)

```typescript
// src/driver/DriverRegistry.ts (NEW FILE)

import { DataSource } from "../data-source/DataSource"
import { Driver } from "./Driver"

export type DriverConstructor = new (dataSource: DataSource) => Driver

/**
 * Registry for custom database drivers.
 * Built-in drivers continue to use DriverFactory.
 * Custom drivers register here and take precedence.
 */
export class DriverRegistry {
    private static customDrivers = new Map<string, DriverConstructor>()

    /**
     * Register a custom driver constructor.
     * Must be called before creating a DataSource with that type.
     */
    static register(type: string, constructor: DriverConstructor): void {
        this.customDrivers.set(type, constructor)
    }

    /**
     * Unregister a custom driver.
     */
    static unregister(type: string): boolean {
        return this.customDrivers.delete(type)
    }

    /**
     * Check if a custom driver is registered for this type.
     */
    static has(type: string): boolean {
        return this.customDrivers.has(type)
    }

    /**
     * Get a custom driver constructor if registered.
     */
    static get(type: string): DriverConstructor | undefined {
        return this.customDrivers.get(type)
    }

    /**
     * Get all registered custom driver types.
     */
    static getCustomTypes(): string[] {
        return Array.from(this.customDrivers.keys())
    }

    /**
     * Clear all custom driver registrations (useful for testing).
     */
    static clear(): void {
        this.customDrivers.clear()
    }
}
```

---

## Step 5: Update DriverFactory to Check Registry First

```typescript
// src/driver/DriverFactory.ts - MODIFY

import { DriverRegistry } from "./DriverRegistry"
// ... existing imports ...

export class DriverFactory {
    create(connection: DataSource): Driver {
        const { type } = connection.options

        // NEW: Check custom registry first
        if (DriverRegistry.has(type)) {
            const CustomDriver = DriverRegistry.get(type)!
            return new CustomDriver(connection)
        }

        // EXISTING: Built-in drivers (unchanged)
        switch (type) {
            case "mysql":
                return new MysqlDriver(connection)
            case "postgres":
                return new PostgresDriver(connection)
            // ... all existing cases unchanged ...
            default:
                throw new MissingDriverError(type, [
                    ...DriverRegistry.getCustomTypes(), // NEW: Include custom types in error
                    "aurora-mysql",
                    "aurora-postgres",
                    // ... existing list ...
                ])
        }
    }
}
```

---

## Step 6: Export New Types

```typescript
// src/index.ts - ADD exports

export * from "./driver/DriverRegistry"
export * from "./driver/types/DriverCapabilities"
```

---

## Step 7: Extend DatabaseType (Optional, for Better TypeScript Support)

```typescript
// src/driver/types/DatabaseType.ts - MODIFY

/**
 * Built-in database types.
 */
export type BuiltInDatabaseType =
    | "mysql"
    | "postgres"
    // ... existing types ...
    | "spanner"

/**
 * Database type. Accepts built-in types or any string for custom drivers.
 * Custom drivers must be registered via DriverRegistry.register() before use.
 */
export type DatabaseType = BuiltInDatabaseType | (string & {})
```

---

## Step 8: Migrate Query Builder Code

Each migration is a separate small PR. Since all drivers have capabilities, these changes don't affect behavior.

### Example 1: USE INDEX Hint

**Before:**

```typescript
// src/query-builder/SelectQueryBuilder.ts:2230
if (DriverUtils.isMySQLFamily(this.connection.driver)) {
    useIndex = ` USE INDEX (${this.expressionMap.useIndex})`
}
```

**After:**

```typescript
// Uses new capability check with fallback
if (DriverUtils.supportsUseIndexHint(this.connection.driver)) {
    useIndex = ` USE INDEX (${this.expressionMap.useIndex})`
}
```

---

### Example 2: DISTINCT ON

**Before:**

```typescript
// src/query-builder/SelectQueryBuilder.ts:2291
if (DriverUtils.isPostgresFamily(driver) && selectDistinctOn.length > 0) {
    select += `DISTINCT ON (${selectDistinctOn.join(", ")}) `
}
```

**After:**

```typescript
if (DriverUtils.supportsDistinctOn(driver) && selectDistinctOn.length > 0) {
    select += `DISTINCT ON (${selectDistinctOn.join(", ")}) `
}
```

---

### Example 3: String Aggregation

**Before:**

```typescript
// Hypothetical current code
if (DriverUtils.isMySQLFamily(driver)) {
    return `GROUP_CONCAT(${column} SEPARATOR ',')`
} else if (
    DriverUtils.isPostgresFamily(driver) ||
    driver.options.type === "mssql"
) {
    return `STRING_AGG(${column}, ',')`
} else if (driver.options.type === "oracle") {
    return `LISTAGG(${column}, ',')`
}
```

**After:**

```typescript
const style = DriverUtils.getStringAggregationStyle(driver)
switch (style) {
    case "GROUP_CONCAT":
        return `GROUP_CONCAT(${column} SEPARATOR ',')`
    case "STRING_AGG":
        return `STRING_AGG(${column}, ',')`
    case "LISTAGG":
        return `LISTAGG(${column}, ',')`
    default:
        throw new Error("String aggregation not supported")
}
```

---

### Example 4: FOR SHARE Locking

**Before:**

```typescript
// src/query-builder/SelectQueryBuilder.ts:2754-2756
if (DriverUtils.isPostgresFamily(driver)) {
    return " FOR SHARE" + lockTablesClause + onLockExpression
} else if (DriverUtils.isMySQLFamily(driver)) {
    return " LOCK IN SHARE MODE"
}
```

**After:**

```typescript
const shareStyle = DriverUtils.getForShareStyle(driver)
if (shareStyle === "FOR_SHARE") {
    const tablesClause = DriverUtils.supportsLockOfTables(driver)
        ? lockTablesClause
        : ""
    return ` FOR SHARE${tablesClause}${onLockExpression}`
} else if (shareStyle === "LOCK_IN_SHARE_MODE") {
    return " LOCK IN SHARE MODE"
}
```

---

### Example 5: SKIP LOCKED / NOWAIT

**Before:**

```typescript
// src/query-builder/SelectQueryBuilder.ts:2782-2785
if (DriverUtils.isPostgresFamily(driver)) {
    return " FOR UPDATE" + lockTablesClause + " SKIP LOCKED"
} else if (DriverUtils.isMySQLFamily(driver)) {
    return " FOR UPDATE SKIP LOCKED"
}
```

**After:**

```typescript
if (DriverUtils.supportsSkipLocked(driver)) {
    const tablesClause = DriverUtils.supportsLockOfTables(driver)
        ? lockTablesClause
        : ""
    return ` FOR UPDATE${tablesClause} SKIP LOCKED`
}
throw new LockNotSupportedError("SKIP LOCKED")
```

---

### Example 6: LIMIT in UPDATE

**Before:**

```typescript
// src/query-builder/SoftDeleteQueryBuilder.ts:568
if (DriverUtils.isMySQLFamily(this.connection.driver)) {
    return " LIMIT " + limit
}
```

**After:**

```typescript
if (DriverUtils.supportsLimitInUpdate(this.connection.driver)) {
    return " LIMIT " + limit
}
```

---

### Example 7: Upsert ON CONFLICT WHERE

**Before:**

```typescript
// src/query-builder/InsertQueryBuilder.ts:591-594
if (indexPredicate && DriverUtils.isPostgresFamily(this.connection.driver)) {
    conflictTarget += ` WHERE ( ${indexPredicate} )`
}
```

**After:**

```typescript
if (
    indexPredicate &&
    DriverUtils.supportsUpsertConflictWhere(this.connection.driver)
) {
    conflictTarget += ` WHERE ( ${indexPredicate} )`
}
```

---

### Example 8: Column Length Requirements

**Before:**

```typescript
// src/metadata-builder/JunctionEntityMetadataBuilder.ts:100-103
if (
    !referencedColumn.length &&
    (DriverUtils.isMySQLFamily(this.connection.driver) ||
        this.connection.driver.options.type === "mssql")
) {
    // Set default length
}
```

**After:**

```typescript
if (
    !referencedColumn.length &&
    DriverUtils.requiresColumnLength(this.connection.driver)
) {
    // Set default length
}
```

---

## Migration Checklist

All `is*Family()` calls must be replaced. Track progress:

| File                             | Count | Old Checks                                            | New Checks                                      |
| -------------------------------- | ----- | ----------------------------------------------------- | ----------------------------------------------- |
| SelectQueryBuilder.ts            | 15    | `isMySQLFamily`, `isPostgresFamily`, `isSQLiteFamily` | Various capability checks                       |
| InsertQueryBuilder.ts            | 12    | `isMySQLFamily`, `isPostgresFamily`, `isSQLiteFamily` | Various capability checks                       |
| UpdateQueryBuilder.ts            | 4     | `isMySQLFamily`, `isPostgresFamily`                   | `supportsLimitInUpdate`, `supportsJoinInUpdate` |
| SoftDeleteQueryBuilder.ts        | 1     | `isMySQLFamily`                                       | `supportsLimitInUpdate`                         |
| RdbmsSchemaBuilder.ts            | 5     | `isMySQLFamily`, `isPostgresFamily`                   | Various capability checks                       |
| EntityMetadataBuilder.ts         | 2     | `isMySQLFamily`                                       | `requiresColumnLength`                          |
| JunctionEntityMetadataBuilder.ts | 2     | `isMySQLFamily`                                       | `requiresColumnLength`                          |
| RelationJoinColumnBuilder.ts     | 1     | `isMySQLFamily`                                       | `requiresColumnLength`                          |
| EntityMetadataValidator.ts       | 2     | `isMySQLFamily`                                       | Various capability checks                       |
| TreeRepository.ts                | 2     | `isSQLiteFamily`                                      | Capability checks                               |
| DataSource.ts                    | 2     | `isMySQLFamily`, `isSQLiteFamily`                     | Capability checks                               |

**Total: ~60 call sites across ~12 files**

---

## Usage Example: Custom Driver (PostgreSQL-Compatible)

```typescript
// my-postgres-fork-driver.ts
import {
    Driver,
    DriverCapabilities,
    DriverRegistry,
    DataSource,
    PostgresDriver,
} from "typeorm"

/**
 * Custom driver extending PostgreSQL with additional capabilities.
 * By declaring capabilities, this driver works with all capability
 * checks without modifying TypeORM core.
 *
 * No need to declare "family" - just declare what features you support.
 */
class MyPostgresForkDriver extends PostgresDriver {
    capabilities: DriverCapabilities = {
        // SQL dialect features
        stringAggregation: "STRING_AGG",
        pagination: "LIMIT_OFFSET",
        useIndexHint: false,
        maxExecutionTimeHint: false,
        distinctOn: true,

        // Upsert
        upsertStyle: "ON_CONFLICT",
        upsertConflictWhere: true,

        // RETURNING
        returningInsert: true,
        returningUpdate: true,
        returningDelete: true,
        returningStyle: "RETURNING",
        returningRequiresInto: false,

        // UPDATE/DELETE modifiers
        limitInUpdate: false,
        limitInDelete: false,
        joinInUpdate: true,

        // Locking
        forUpdate: true,
        forShareStyle: "FOR_SHARE",
        forKeyShare: true,
        forNoKeyUpdate: true,
        skipLocked: true,
        nowait: true,
        lockOfTables: true,

        // CTE
        cteEnabled: true,
        cteRecursive: true,
        cteRequiresRecursiveKeyword: true,
        cteWritable: true,
        cteMaterializedHint: true,

        // DDL
        indexTypes: ["BTREE", "HASH", "GIN", "GIST", "BRIN", "MY_CUSTOM_INDEX"],
        defaultIndexType: "BTREE",
        partialIndexes: true,
        expressionIndexes: true,

        // Column types
        requiresColumnLength: false,
        jsonColumnType: true,
        uuidColumnType: true,
        arrayColumnType: true,

        // Transactions
        transactionSupport: "nested",
    }

    // Override methods as needed...
}

// Register BEFORE creating DataSource
DriverRegistry.register("my-postgres-fork", MyPostgresForkDriver)

// Now can use
const dataSource = new DataSource({
    type: "my-postgres-fork" as any,
    host: "localhost",
    // ...
})
```

---

## Usage Example: Completely New Database

```typescript
// custom-timeseries-driver.ts
import {
    Driver,
    DriverCapabilities,
    DriverRegistry,
    QueryRunner,
    DataSource,
} from "typeorm"

/**
 * A custom time-series database driver.
 * Declares exactly what it supports - no need to fit into a "family".
 */
class TimeSeriesDriver implements Driver {
    capabilities: DriverCapabilities = {
        // SQL dialect - basic SQL support
        stringAggregation: null, // Not supported
        pagination: "LIMIT_OFFSET",
        useIndexHint: false,
        maxExecutionTimeHint: false,
        distinctOn: false,

        // No upsert support
        upsertStyle: null,
        upsertConflictWhere: false,

        // No RETURNING support
        returningInsert: false,
        returningUpdate: false,
        returningDelete: false,
        returningStyle: null,

        // No UPDATE/DELETE modifiers
        limitInUpdate: false,
        limitInDelete: false,
        joinInUpdate: false,

        // Read-optimized - minimal locking
        forUpdate: false,
        forShareStyle: null,
        skipLocked: false,
        nowait: false,
        lockOfTables: false,
        forKeyShare: false,
        forNoKeyUpdate: false,

        // Basic CTE only
        cteEnabled: true,
        cteRecursive: false,
        cteRequiresRecursiveKeyword: false,
        cteWritable: false,
        cteMaterializedHint: false,

        // Custom index types
        indexTypes: ["TIMESERIES", "BTREE", "BLOOM"],
        defaultIndexType: "TIMESERIES",
        partialIndexes: false,
        expressionIndexes: false,

        // Column types
        requiresColumnLength: false,
        jsonColumnType: true,
        uuidColumnType: false,
        arrayColumnType: false,

        // Simple transactions
        transactionSupport: "simple",
    }

    // Implement full Driver interface...
    options: any
    database?: string
    // ... etc
}

DriverRegistry.register("timeseries-db", TimeSeriesDriver)
```

---

## Migration Path - Remove is\*Family Entirely

### Phase 1: Add Capabilities to All Built-in Drivers (Non-Breaking)

**One PR per driver, can be done in parallel**

Add `capabilities` object to every built-in driver with all relevant flags:

```typescript
// Example: MysqlDriver
capabilities: DriverCapabilities = {
    stringAggregation: "GROUP_CONCAT",
    pagination: "LIMIT_OFFSET",
    useIndexHint: true,
    maxExecutionTimeHint: true,
    distinctOn: false,
    upsertStyle: "ON_DUPLICATE_KEY",
    // ... all other capabilities
}
```

Drivers to update:

- PostgresDriver, CockroachDriver, AuroraPostgresDriver
- MysqlDriver, AuroraMysqlDriver
- All SQLite family drivers (SqliteDriver, BetterSqlite3Driver, SqljsDriver, etc.)
- SqlServerDriver
- OracleDriver
- SapDriver
- SpannerDriver
- MongoDriver

**Result:** All built-in drivers have capabilities. No behavior change yet.

### Phase 2: Add Capability Helper Methods to DriverUtils (Non-Breaking)

**Single PR**

Add all `supportsX()` and `getXStyle()` methods to DriverUtils.
Keep `is*Family()` methods temporarily (they still work).

**Result:** New capability checks available. Old family checks still work.

### Phase 3: Migrate All Call Sites (Non-Breaking)

**Many small PRs, one file or feature at a time**

Replace every `is*Family()` call with specific capability check:

| File                          | Old                        | New                                        |
| ----------------------------- | -------------------------- | ------------------------------------------ |
| SelectQueryBuilder.ts:2230    | `isMySQLFamily(driver)`    | `supportsUseIndexHint(driver)`             |
| SelectQueryBuilder.ts:2291    | `isPostgresFamily(driver)` | `supportsDistinctOn(driver)`               |
| SelectQueryBuilder.ts:2754    | `isPostgresFamily(driver)` | `getForShareStyle(driver) === 'FOR_SHARE'` |
| SoftDeleteQueryBuilder.ts:568 | `isMySQLFamily(driver)`    | `supportsLimitInUpdate(driver)`            |
| ...                           | ...                        | ...                                        |

Each PR is small, focused, and easy to review.

**Result:** No code calls `is*Family()` anymore.

### Phase 4: Remove is\*Family Methods (Non-Breaking for TypeORM, Breaking for External Code)

**Single PR**

Delete from DriverUtils:

- `isSQLiteFamily()`
- `isMySQLFamily()`
- `isPostgresFamily()`

**Result:** Family methods gone. Capability-based checks only.

### Why This is Non-Breaking for TypeORM Users

1. **All built-in drivers work** - They have capabilities defined
2. **Query behavior unchanged** - Same SQL generated, just different code path
3. **DataSource configuration unchanged** - No API changes
4. **Custom drivers work** - They implement capabilities interface

### What Breaks (Intentionally)

External code that:

- Calls `DriverUtils.isMySQLFamily()` directly - Must update to capability checks
- Extends Driver without `capabilities` - Must add capabilities

This is a **conscious tradeoff**: we break a small surface area (3 utility methods) to gain a much cleaner architecture.

---

## Step 9: Add Capabilities to Built-in Drivers (Phase 1)

```typescript
// src/driver/postgres/PostgresDriver.ts - ADD capabilities property

export class PostgresDriver implements Driver {
    // ... existing properties ...

    /**
     * Driver capabilities declaration - replaces family-based detection
     */
    capabilities: DriverCapabilities = {
        // Dialect
        stringAggregation: "STRING_AGG",
        pagination: "LIMIT_OFFSET",
        useIndexHint: false,
        maxExecutionTimeHint: false,
        distinctOn: true,

        // Upsert
        upsertStyle: "ON_CONFLICT",
        upsertConflictWhere: true,

        // Returning
        returningInsert: true,
        returningUpdate: true,
        returningDelete: true,
        returningStyle: "RETURNING",
        returningRequiresInto: false,

        // Update/Delete
        limitInUpdate: false,
        limitInDelete: false,
        joinInUpdate: true,

        // Locking
        forUpdate: true,
        forShareStyle: "FOR_SHARE",
        forKeyShare: true,
        forNoKeyUpdate: true,
        skipLocked: true,
        nowait: true,
        lockOfTables: true,

        // CTE
        cteEnabled: true,
        cteRecursive: true,
        cteRequiresRecursiveKeyword: true,
        cteWritable: true,
        cteMaterializedHint: true,

        // DDL
        indexTypes: ["BTREE", "HASH", "GIN", "GIST", "SPGIST", "BRIN"],
        defaultIndexType: "BTREE",
        partialIndexes: true,
        expressionIndexes: true,

        // Column types
        requiresColumnLength: false,
        jsonColumnType: true,
        uuidColumnType: true,
        arrayColumnType: true,

        // Transactions
        transactionSupport: "nested",
    }

    // ... rest of driver unchanged ...
}
```

```typescript
// src/driver/mysql/MysqlDriver.ts - ADD capabilities property

export class MysqlDriver implements Driver {
    // ... existing properties ...

    capabilities: DriverCapabilities = {
        // Dialect
        stringAggregation: "GROUP_CONCAT",
        pagination: "LIMIT_OFFSET",
        useIndexHint: true,
        maxExecutionTimeHint: true,
        distinctOn: false,

        // Upsert
        upsertStyle: "ON_DUPLICATE_KEY",
        upsertConflictWhere: false,

        // Returning (MariaDB 10.5+ only - set dynamically)
        returningInsert: false,
        returningUpdate: false,
        returningDelete: false,
        returningStyle: null,

        // Update/Delete
        limitInUpdate: true,
        limitInDelete: true,
        joinInUpdate: true,

        // Locking
        forUpdate: true,
        forShareStyle: "LOCK_IN_SHARE_MODE",
        forKeyShare: false,
        forNoKeyUpdate: false,
        skipLocked: true, // MySQL 8.0+
        nowait: true, // MySQL 8.0+
        lockOfTables: false,

        // CTE (MySQL 8.0+ / MariaDB 10.2+ - set dynamically)
        cteEnabled: false,
        cteRecursive: false,
        cteRequiresRecursiveKeyword: false,
        cteWritable: false,
        cteMaterializedHint: false,

        // DDL
        indexTypes: ["BTREE", "HASH", "FULLTEXT", "SPATIAL"],
        defaultIndexType: "BTREE",
        partialIndexes: false,
        expressionIndexes: true, // MySQL 8.0+

        // Column types
        requiresColumnLength: true,
        jsonColumnType: true,
        uuidColumnType: false,
        arrayColumnType: false,

        // Transactions
        transactionSupport: "nested",
    }

    // In afterConnect(), update capabilities based on detected version:
    async afterConnect(): Promise<void> {
        // Existing version detection...

        // Update capabilities based on detected version
        if (
            this.options.type === "mariadb" &&
            this.isVersionGreaterOrEqual("10.5")
        ) {
            this.capabilities.returningInsert = true
            this.capabilities.returningDelete = true
            this.capabilities.returningStyle = "RETURNING"
        }

        if (this.isVersionGreaterOrEqual("8.0")) {
            this.capabilities.cteEnabled = true
            this.capabilities.cteRecursive = true
            this.capabilities.cteRequiresRecursiveKeyword = true
        }
    }
}
```

---

## Files Changed Summary

### Phase 1: Add Capabilities to All Built-in Drivers

| File                                                 | Change Type  | Description                                      |
| ---------------------------------------------------- | ------------ | ------------------------------------------------ |
| `src/driver/types/DriverCapabilities.ts`             | **New**      | Comprehensive capabilities interface (~30 flags) |
| `src/driver/DriverRegistry.ts`                       | **New**      | Custom driver registration                       |
| `src/driver/Driver.ts`                               | Add property | Required `capabilities: DriverCapabilities`      |
| `src/driver/postgres/PostgresDriver.ts`              | Add property | `capabilities` object                            |
| `src/driver/cockroachdb/CockroachDriver.ts`          | Add property | `capabilities` object                            |
| `src/driver/mysql/MysqlDriver.ts`                    | Add property | `capabilities` object (with version gating)      |
| `src/driver/sqlserver/SqlServerDriver.ts`            | Add property | `capabilities` object                            |
| `src/driver/oracle/OracleDriver.ts`                  | Add property | `capabilities` object                            |
| `src/driver/sap/SapDriver.ts`                        | Add property | `capabilities` object                            |
| `src/driver/spanner/SpannerDriver.ts`                | Add property | `capabilities` object                            |
| `src/driver/mongodb/MongoDriver.ts`                  | Add property | `capabilities` object                            |
| `src/driver/sqlite-abstract/AbstractSqliteDriver.ts` | Add property | `capabilities` object                            |
| All other drivers...                                 | Add property | `capabilities` object                            |

### Phase 2: Add Capability Helper Methods

| File                               | Change Type | Description                                               |
| ---------------------------------- | ----------- | --------------------------------------------------------- |
| `src/driver/DriverUtils.ts`        | Add methods | `supportsUseIndexHint()`, `supportsDistinctOn()`, etc.    |
| `src/driver/DriverUtils.ts`        | Add methods | `getStringAggregationStyle()`, `getForShareStyle()`, etc. |
| `src/driver/DriverFactory.ts`      | Modify      | Check DriverRegistry first                                |
| `src/driver/types/DatabaseType.ts` | Modify      | `(string & {})` for extensibility                         |
| `src/index.ts`                     | Add exports | `DriverRegistry`, `DriverCapabilities`                    |

### Phase 3: Migrate Query Builders (Many Small PRs)

| File                                          | Change Type | Description                                 |
| --------------------------------------------- | ----------- | ------------------------------------------- |
| `src/query-builder/SelectQueryBuilder.ts`     | Modify      | Replace all `is*Family` → capability checks |
| `src/query-builder/InsertQueryBuilder.ts`     | Modify      | Replace all `is*Family` → capability checks |
| `src/query-builder/UpdateQueryBuilder.ts`     | Modify      | Replace all `is*Family` → capability checks |
| `src/query-builder/DeleteQueryBuilder.ts`     | Modify      | Replace all `is*Family` → capability checks |
| `src/query-builder/SoftDeleteQueryBuilder.ts` | Modify      | Replace all `is*Family` → capability checks |
| `src/query-builder/QueryBuilder.ts`           | Modify      | Replace all `is*Family` → capability checks |
| `src/schema-builder/RdbmsSchemaBuilder.ts`    | Modify      | Replace all `is*Family` → capability checks |
| `src/metadata-builder/*.ts`                   | Modify      | Replace all `is*Family` → capability checks |
| `src/repository/TreeRepository.ts`            | Modify      | Replace all `is*Family` → capability checks |

### Phase 4: Remove Family Methods

| File                        | Change Type | Description          |
| --------------------------- | ----------- | -------------------- |
| `src/driver/DriverUtils.ts` | **Delete**  | `isSQLiteFamily()`   |
| `src/driver/DriverUtils.ts` | **Delete**  | `isMySQLFamily()`    |
| `src/driver/DriverUtils.ts` | **Delete**  | `isPostgresFamily()` |

---

## Backward Compatibility Analysis

### For TypeORM Users (Application Developers)

| Aspect                       | Breaking? | Notes              |
| ---------------------------- | --------- | ------------------ |
| DataSource configuration     | No        | Unchanged          |
| Query behavior               | No        | Same SQL generated |
| Repository API               | No        | Unchanged          |
| EntityManager API            | No        | Unchanged          |
| `driver.options.type` checks | No        | Still works        |

### For Custom Driver Authors

| Aspect                        | Breaking? | Notes                            |
| ----------------------------- | --------- | -------------------------------- |
| Extending built-in drivers    | No        | Inherits parent's capabilities   |
| Implementing Driver interface | **Yes**   | Must add `capabilities` property |
| Using DriverRegistry          | No        | New API, opt-in                  |

### For External Libraries Using TypeORM Internals

| Aspect                             | Breaking? | Notes                           |
| ---------------------------------- | --------- | ------------------------------- |
| `DriverUtils.isMySQLFamily()`      | **Yes**   | Removed - use capability checks |
| `DriverUtils.isPostgresFamily()`   | **Yes**   | Removed - use capability checks |
| `DriverUtils.isSQLiteFamily()`     | **Yes**   | Removed - use capability checks |
| `DriverUtils.buildAlias()`         | No        | Unchanged                       |
| `DriverUtils.buildDriverOptions()` | No        | Unchanged                       |

### Migration for External Code

If external code uses `is*Family()`:

```typescript
// Before
if (DriverUtils.isMySQLFamily(driver)) {
    // MySQL-specific logic
}

// After - Option 1: Use specific capability
if (DriverUtils.supportsUseIndexHint(driver)) {
    // USE INDEX hint logic
}

// After - Option 2: Check type directly (if really need type)
if (["mysql", "mariadb"].includes(driver.options.type)) {
    // MySQL-specific logic
}
```

### API Changes Summary

| API                              | Status                        |
| -------------------------------- | ----------------------------- |
| `DriverUtils.isMySQLFamily()`    | **Removed**                   |
| `DriverUtils.isPostgresFamily()` | **Removed**                   |
| `DriverUtils.isSQLiteFamily()`   | **Removed**                   |
| `DriverUtils.supportsX()`        | **Added** (many methods)      |
| `DriverUtils.getXStyle()`        | **Added** (many methods)      |
| `Driver.capabilities`            | **Added** (required)          |
| `DriverRegistry`                 | **Added**                     |
| `DriverCapabilities`             | **Added**                     |
| `driver.options.type`            | Unchanged                     |
| `driver.supportedUpsertTypes`    | Deprecated (use capabilities) |
| `driver.cteCapabilities`         | Deprecated (use capabilities) |
| `driver.transactionSupport`      | Deprecated (use capabilities) |

---

## Testing Strategy

```typescript
describe("DriverRegistry", () => {
    afterEach(() => {
        DriverRegistry.clear()
    })

    it("should allow registering custom drivers", () => {
        DriverRegistry.register("custom", CustomDriver)
        expect(DriverRegistry.has("custom")).toBe(true)
    })

    it("should create custom driver via DriverFactory", () => {
        DriverRegistry.register("custom", CustomDriver)
        const factory = new DriverFactory()
        const driver = factory.create(mockDataSource({ type: "custom" }))
        expect(driver).toBeInstanceOf(CustomDriver)
    })

    it("should recognize custom driver in family via capabilities", () => {
        DriverRegistry.register("my-mysql", MyMySQLDriver)
        const driver = new MyMySQLDriver(mockDataSource)
        driver.capabilities = { family: { mysql: true } }
        expect(DriverUtils.isMySQLFamily(driver)).toBe(true)
    })

    it("should not break existing built-in drivers", () => {
        const mysqlDriver = new MysqlDriver(mockDataSource)
        expect(DriverUtils.isMySQLFamily(mysqlDriver)).toBe(true)
    })
})
```

---

## Summary

### What Gets Removed

| Removed                          | Replacement                |
| -------------------------------- | -------------------------- |
| `DriverUtils.isMySQLFamily()`    | Specific capability checks |
| `DriverUtils.isPostgresFamily()` | Specific capability checks |
| `DriverUtils.isSQLiteFamily()`   | Specific capability checks |

### What Gets Added

| Added                             | Purpose                             |
| --------------------------------- | ----------------------------------- |
| `DriverCapabilities` interface    | Declares ~30 specific feature flags |
| `DriverRegistry`                  | Custom driver registration          |
| `DriverUtils.supportsX()` methods | Capability checks (one per feature) |
| `DriverUtils.getXStyle()` methods | Capability value getters            |

### Complete Mapping: Family Checks → Capability Checks

| Old `isMySQLFamily` Use Case | New Capability Check                                   |
| ---------------------------- | ------------------------------------------------------ |
| USE INDEX hint               | `supportsUseIndexHint(driver)`                         |
| MAX_EXECUTION_TIME hint      | `supportsMaxExecutionTimeHint(driver)`                 |
| GROUP_CONCAT                 | `getStringAggregationStyle(driver) === 'GROUP_CONCAT'` |
| LIMIT in UPDATE              | `supportsLimitInUpdate(driver)`                        |
| LIMIT in DELETE              | `supportsLimitInDelete(driver)`                        |
| LOCK IN SHARE MODE           | `getForShareStyle(driver) === 'LOCK_IN_SHARE_MODE'`    |
| Column length required       | `requiresColumnLength(driver)`                         |
| ON DUPLICATE KEY             | `getUpsertStyle(driver) === 'ON_DUPLICATE_KEY'`        |

| Old `isPostgresFamily` Use Case | New Capability Check                       |
| ------------------------------- | ------------------------------------------ |
| DISTINCT ON                     | `supportsDistinctOn(driver)`               |
| FOR SHARE                       | `getForShareStyle(driver) === 'FOR_SHARE'` |
| FOR KEY SHARE                   | `supportsForKeyShare(driver)`              |
| SKIP LOCKED                     | `supportsSkipLocked(driver)`               |
| NOWAIT                          | `supportsNowait(driver)`                   |
| OF table_name                   | `supportsLockOfTables(driver)`             |
| ON CONFLICT WHERE               | `supportsUpsertConflictWhere(driver)`      |
| RETURNING                       | `supportsReturning(driver, 'insert')`      |
| ON CONFLICT                     | `getUpsertStyle(driver) === 'ON_CONFLICT'` |

| Old `isSQLiteFamily` Use Case | New Capability Check                            |
| ----------------------------- | ----------------------------------------------- |
| ON CONFLICT                   | `getUpsertStyle(driver) === 'ON_CONFLICT'`      |
| LIMIT OFFSET                  | `getPaginationStyle(driver) === 'LIMIT_OFFSET'` |
| Transaction support           | `getTransactionSupport(driver)`                 |

### Why Remove Family Checks?

1. **Families are lies** - CockroachDB is "postgres family" but doesn't support FOR UPDATE
2. **Features are granular** - A driver might support SKIP LOCKED but not FOR KEY SHARE
3. **Custom drivers don't fit** - A new database shouldn't have to pretend to be MySQL
4. **Capability checks are self-documenting** - `supportsDistinctOn()` is clearer than `isPostgresFamily()`
5. **Reduces maintenance** - No hardcoded arrays to update

### Is This Breaking?

**For TypeORM users:** No. All behavior is unchanged.

**For TypeORM contributors:** Minimal. Replace family checks with capability checks.

**For external code using `DriverUtils.is*Family()`:** Yes. Must update to use:

- Specific capability checks, OR
- Check `driver.options.type` directly (already works)
