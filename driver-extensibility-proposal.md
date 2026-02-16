# TypeORM Driver Extensibility Proposal

## Problem Statement

The current TypeORM driver system has several maintainability and extensibility issues:

1. **Hardcoded family checks** (`DriverUtils.isSQLiteFamily()`, `isMySQLFamily()`, `isPostgresFamily()`) contain hardcoded arrays that cannot be extended by custom drivers
2. **String literal type checks** (`driver.options.type === "mysql"`) scattered across 30+ files
3. **Identity-based detection** instead of capability-based: "is this MySQL?" vs "does this support X?"
4. **Closed type system** (`DatabaseType` union) prevents external driver registration
5. **Inconsistent feature exposure** (e.g., `supportedIndexTypes` only implemented for PostgreSQL)

## Proposed Solution: Capability-Based Driver Architecture

### Core Principle

Replace **identity checks** with **capability declarations**. Instead of asking "is this MySQL?", ask "does this driver support GROUP_CONCAT?".

---

## Part 1: Driver Capabilities Interface

### 1.1 Main Capabilities Structure

```typescript
// src/driver/types/DriverCapabilities.ts

export interface DriverCapabilities {
    /**
     * SQL dialect features - syntax variations
     */
    dialect: DialectCapabilities

    /**
     * DML (INSERT/UPDATE/DELETE) capabilities
     */
    dml: DmlCapabilities

    /**
     * DDL (schema) capabilities
     */
    ddl: DdlCapabilities

    /**
     * Transaction capabilities
     */
    transactions: TransactionCapabilities

    /**
     * CTE (WITH clause) capabilities
     */
    cte: CteCapabilities

    /**
     * Locking capabilities (FOR UPDATE, etc.)
     */
    locking: LockingCapabilities
}
```

### 1.2 Dialect Capabilities (replaces most family checks)

```typescript
export interface DialectCapabilities {
    /**
     * Pagination style
     * - 'LIMIT_OFFSET': LIMIT x OFFSET y (MySQL, Postgres, SQLite)
     * - 'TOP': SELECT TOP x (MSSQL)
     * - 'ROWNUM': WHERE ROWNUM <= x (Oracle legacy)
     * - 'FETCH_FIRST': OFFSET x ROWS FETCH FIRST y (Oracle 12c+, MSSQL 2012+)
     */
    pagination: "LIMIT_OFFSET" | "TOP" | "ROWNUM" | "FETCH_FIRST"

    /**
     * String aggregation function
     * - 'GROUP_CONCAT': MySQL/MariaDB style
     * - 'STRING_AGG': Postgres/MSSQL style
     * - 'LISTAGG': Oracle style
     * - null: not supported
     */
    stringAggregation: "GROUP_CONCAT" | "STRING_AGG" | "LISTAGG" | null

    /**
     * Boolean type handling
     */
    booleanType: "NATIVE" | "TINYINT" | "BIT" | "NUMBER"

    /**
     * Identifier quote character
     */
    identifierQuote: '"' | "`" | "["

    /**
     * Parameter placeholder style
     */
    parameterStyle:
        | "POSITIONAL_DOLLAR"
        | "POSITIONAL_QUESTION"
        | "NAMED_COLON"
        | "NAMED_AT"

    /**
     * DISTINCT ON support (Postgres-specific)
     */
    distinctOn: boolean

    /**
     * USE INDEX hint support
     */
    useIndexHint: boolean

    /**
     * MAX_EXECUTION_TIME hint support
     */
    maxExecutionTimeHint: boolean

    /**
     * Dummy table for SELECT without FROM (Oracle: DUAL)
     */
    dummyTableName: string | null

    /**
     * Default CURRENT_TIMESTAMP expression
     */
    currentTimestampExpression: string
}
```

### 1.3 DML Capabilities

```typescript
export interface DmlCapabilities {
    /**
     * Upsert support
     */
    upsert: {
        /**
         * Supported upsert styles
         * - 'ON_CONFLICT': PostgreSQL/SQLite style
         * - 'ON_DUPLICATE_KEY': MySQL style
         * - 'MERGE_INTO': MSSQL/Oracle/SAP style
         */
        styles: UpsertStyle[]

        /**
         * Can specify conflict target columns
         */
        conflictTarget: boolean

        /**
         * Can use WHERE clause in ON CONFLICT
         */
        conflictWhere: boolean

        /**
         * Supports DO NOTHING
         */
        doNothing: boolean
    }

    /**
     * RETURNING/OUTPUT clause support per operation
     */
    returning: {
        insert: boolean
        update: boolean
        delete: boolean

        /**
         * Syntax style
         * - 'RETURNING': PostgreSQL/Oracle (after statement)
         * - 'OUTPUT': MSSQL (inline with INTO)
         */
        style: "RETURNING" | "OUTPUT" | null

        /**
         * Requires INTO clause (Oracle)
         */
        requiresInto: boolean
    }

    /**
     * Bulk insert support
     */
    bulkInsert: {
        supported: boolean
        maxRows?: number
    }

    /**
     * UPDATE/DELETE modifiers
     */
    updateDelete: {
        /**
         * LIMIT in UPDATE (MySQL)
         */
        limitInUpdate: boolean

        /**
         * LIMIT in DELETE (MySQL)
         */
        limitInDelete: boolean

        /**
         * ORDER BY in UPDATE/DELETE (MySQL)
         */
        orderBy: boolean

        /**
         * JOIN in UPDATE (MySQL, MSSQL, Postgres)
         */
        joinInUpdate: boolean

        /**
         * JOIN in DELETE
         */
        joinInDelete: boolean
    }

    /**
     * Identity/auto-increment handling
     */
    identity: {
        /**
         * SET IDENTITY_INSERT support (MSSQL)
         */
        identityInsert: boolean

        /**
         * LAST_INSERT_ID() or similar
         */
        lastInsertId: boolean

        /**
         * Sequences support (Postgres, Oracle)
         */
        sequences: boolean

        /**
         * Can return generated values via RETURNING
         */
        returningGenerated: boolean
    }

    /**
     * Spatial data handling
     */
    spatial: {
        /**
         * Has spatial types
         */
        supported: boolean

        /**
         * Function to create geometry from text
         * e.g., 'ST_GeomFromText', 'GeomFromText'
         */
        geometryFromText: string | null

        /**
         * Requires SRID specification
         */
        requiresSrid: boolean
    }
}

export type UpsertStyle = "ON_CONFLICT" | "ON_DUPLICATE_KEY" | "MERGE_INTO"
```

### 1.4 DDL Capabilities

```typescript
export interface DdlCapabilities {
    /**
     * Index support
     */
    indexes: {
        /**
         * Supported index types
         */
        types: IndexType[]

        /**
         * Default index type when not specified
         */
        defaultType: IndexType

        /**
         * Fulltext index support
         */
        fulltext: boolean

        /**
         * Spatial index support
         */
        spatial: boolean

        /**
         * Partial/filtered index support (WHERE clause)
         */
        partial: boolean

        /**
         * Expression/functional index support
         */
        expression: boolean

        /**
         * Concurrent index creation (Postgres)
         */
        concurrent: boolean
    }

    /**
     * Schema organization
     */
    namespacing: {
        /**
         * Supports multiple databases
         */
        databases: boolean

        /**
         * Supports schemas within database
         */
        schemas: boolean

        /**
         * Default schema name
         */
        defaultSchema: string | null
    }

    /**
     * Column type features
     */
    columnTypes: {
        enum: "NATIVE" | "CHECK_CONSTRAINT" | null
        array: boolean
        json: boolean
        jsonb: boolean
        uuid: boolean
        interval: boolean
        hstore: boolean
    }

    /**
     * Constraint features
     */
    constraints: {
        check: boolean
        exclusion: boolean
        deferrable: boolean
    }

    /**
     * ALTER TABLE capabilities
     */
    alterTable: {
        addColumn: boolean
        dropColumn: boolean
        alterColumnType: boolean
        renameColumn: boolean
        renameTable: boolean
        addConstraintInline: boolean
    }
}

export type IndexType =
    | "BTREE"
    | "HASH"
    | "GIN"
    | "GIST"
    | "SPGIST"
    | "BRIN"
    | "FULLTEXT"
    | "SPATIAL"
    | "CLUSTERED"
    | "NONCLUSTERED"
    | "COLUMNSTORE"
```

### 1.5 Transaction Capabilities

```typescript
export interface TransactionCapabilities {
    /**
     * Transaction support level
     */
    support: "none" | "simple" | "nested"

    /**
     * Savepoint support
     */
    savepoints: boolean

    /**
     * Supported isolation levels
     */
    isolationLevels: IsolationLevel[]

    /**
     * READ ONLY transaction support
     */
    readOnly: boolean

    /**
     * DEFERRABLE transaction support (Postgres)
     */
    deferrable: boolean
}
```

### 1.6 Locking Capabilities (replaces locking family checks)

```typescript
export interface LockingCapabilities {
    /**
     * FOR UPDATE support
     */
    forUpdate: boolean

    /**
     * FOR SHARE / LOCK IN SHARE MODE support
     */
    forShare: boolean

    /**
     * FOR KEY SHARE support (Postgres)
     */
    forKeyShare: boolean

    /**
     * FOR NO KEY UPDATE support (Postgres)
     */
    forNoKeyUpdate: boolean

    /**
     * SKIP LOCKED support
     */
    skipLocked: boolean

    /**
     * NOWAIT support
     */
    nowait: boolean

    /**
     * OF table_name support (lock specific tables)
     */
    ofTables: boolean
}
```

### 1.7 CTE Capabilities (expand existing)

```typescript
export interface CteCapabilities {
    /**
     * CTEs enabled at all
     */
    enabled: boolean

    /**
     * Recursive CTEs
     */
    recursive: boolean

    /**
     * Requires RECURSIVE keyword
     */
    requiresRecursiveKeyword: boolean

    /**
     * DML in CTE (writable CTEs)
     */
    writable: boolean

    /**
     * MATERIALIZED hint support
     */
    materializedHint: boolean

    /**
     * NOT MATERIALIZED hint support
     */
    notMaterializedHint: boolean
}
```

---

## Part 2: Driver Interface Updates

### 2.1 Updated Driver Interface

```typescript
// src/driver/Driver.ts

export interface Driver {
    // Existing properties...
    options: BaseDataSourceOptions
    database?: string
    schema?: string
    version?: string

    /**
     * Driver capabilities - replaces family checks
     */
    capabilities: DriverCapabilities

    // Keep for backward compat, but mark deprecated
    /** @deprecated Use capabilities.transactions.support */
    transactionSupport: "simple" | "nested" | "none"

    /** @deprecated Use capabilities.ddl.indexes.types */
    supportedIndexTypes?: IndexType[]

    /** @deprecated Use capabilities.dml.upsert.styles */
    supportedUpsertTypes: UpsertStyle[]

    /** @deprecated Use capabilities.cte */
    cteCapabilities: CteCapabilities

    /** @deprecated Use capabilities.transactions.support !== 'none' */
    treeSupport: boolean

    // New: SQL building methods (move dialect logic into driver)
    /**
     * Build pagination clause
     */
    buildPagination(limit?: number, offset?: number): string

    /**
     * Build locking clause
     */
    buildLocking(
        mode: LockMode,
        tables?: string[],
        options?: LockOptions,
    ): string

    /**
     * Build string aggregation expression
     */
    buildStringAgg(column: string, separator: string, orderBy?: string): string

    /**
     * Build upsert statement
     */
    buildUpsert(config: UpsertConfig): string

    // Existing methods...
    escape(name: string): string
    buildTableName(
        tableName: string,
        schema?: string,
        database?: string,
    ): string
    // ...
}
```

---

## Part 3: Driver Registry (Extensibility)

### 3.1 Registry Implementation

```typescript
// src/driver/DriverRegistry.ts

export type DriverConstructor = new (dataSource: DataSource) => Driver

export class DriverRegistry {
    private static drivers = new Map<string, DriverConstructor>()
    private static initialized = false

    /**
     * Register a driver constructor for a database type
     */
    static register(type: string, constructor: DriverConstructor): void {
        this.drivers.set(type, constructor)
    }

    /**
     * Get registered driver types
     */
    static getRegisteredTypes(): string[] {
        this.ensureInitialized()
        return Array.from(this.drivers.keys())
    }

    /**
     * Create a driver instance
     */
    static create(type: string, dataSource: DataSource): Driver {
        this.ensureInitialized()

        const Constructor = this.drivers.get(type)
        if (!Constructor) {
            throw new MissingDriverError(type, this.getRegisteredTypes())
        }
        return new Constructor(dataSource)
    }

    /**
     * Check if a driver type is registered
     */
    static has(type: string): boolean {
        this.ensureInitialized()
        return this.drivers.has(type)
    }

    private static ensureInitialized(): void {
        if (!this.initialized) {
            this.registerBuiltInDrivers()
            this.initialized = true
        }
    }

    private static registerBuiltInDrivers(): void {
        // Built-in drivers register themselves
        this.register("mysql", MysqlDriver)
        this.register("mariadb", MysqlDriver)
        this.register("postgres", PostgresDriver)
        this.register("cockroachdb", CockroachDriver)
        this.register("sqlite", SqliteDriver)
        this.register("better-sqlite3", BetterSqlite3Driver)
        this.register("sqljs", SqljsDriver)
        this.register("mssql", SqlServerDriver)
        this.register("oracle", OracleDriver)
        this.register("mongodb", MongoDriver)
        this.register("sap", SapDriver)
        this.register("spanner", SpannerDriver)
        // ... etc
    }
}
```

### 3.2 Updated DriverFactory

```typescript
// src/driver/DriverFactory.ts

export class DriverFactory {
    create(dataSource: DataSource): Driver {
        return DriverRegistry.create(dataSource.options.type, dataSource)
    }
}
```

### 3.3 Extensible DatabaseType

```typescript
// src/driver/types/DatabaseType.ts

/**
 * Built-in database types
 */
export type BuiltInDatabaseType =
    | "mysql"
    | "mariadb"
    | "postgres"
    | "cockroachdb"
    | "sqlite"
    | "better-sqlite3"
    | "sqljs"
    | "mssql"
    | "oracle"
    | "mongodb"
    | "sap"
    | "spanner"
    | "aurora-mysql"
    | "aurora-postgres"
    | "cordova"
    | "react-native"
    | "nativescript"
    | "expo"
    | "capacitor"

/**
 * Database type - can be built-in or any registered custom type
 */
export type DatabaseType = BuiltInDatabaseType | (string & {})
```

---

## Part 4: Refactoring Patterns

### 4.1 Before/After: Family Checks

**Before:**

```typescript
// SelectQueryBuilder.ts
if (DriverUtils.isMySQLFamily(this.connection.driver)) {
    useIndex = ` USE INDEX (${this.expressionMap.useIndex})`
}
```

**After:**

```typescript
if (this.connection.driver.capabilities.dialect.useIndexHint) {
    useIndex = ` USE INDEX (${this.expressionMap.useIndex})`
}
```

---

**Before:**

```typescript
if (DriverUtils.isMySQLFamily(driver)) {
    select += `/*+ MAX_EXECUTION_TIME(${time}) */ `
}
```

**After:**

```typescript
if (driver.capabilities.dialect.maxExecutionTimeHint) {
    select += `/*+ MAX_EXECUTION_TIME(${time}) */ `
}
```

---

**Before:**

```typescript
if (DriverUtils.isPostgresFamily(driver) && selectDistinctOn.length > 0) {
    select += `DISTINCT ON (${selectDistinctOn.join(", ")}) `
}
```

**After:**

```typescript
if (driver.capabilities.dialect.distinctOn && selectDistinctOn.length > 0) {
    select += `DISTINCT ON (${selectDistinctOn.join(", ")}) `
}
```

---

### 4.2 Before/After: Pagination

**Before:**

```typescript
if (DriverUtils.isMySQLFamily(driver) || DriverUtils.isSQLiteFamily(driver)) {
    return ` LIMIT ${limit} OFFSET ${offset}`
} else if (driver.options.type === "mssql") {
    return ` OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`
} else if (driver.options.type === "oracle") {
    // ROWNUM logic...
}
```

**After:**

```typescript
// In query builder:
return this.connection.driver.buildPagination(limit, offset);

// In driver implementation (e.g., MysqlDriver):
buildPagination(limit?: number, offset?: number): string {
    if (limit && offset) return ` LIMIT ${limit} OFFSET ${offset}`;
    if (limit) return ` LIMIT ${limit}`;
    return '';
}
```

---

### 4.3 Before/After: Locking

**Before:**

```typescript
if (DriverUtils.isPostgresFamily(driver)) {
    return " FOR SHARE" + lockTablesClause + onLockExpression
} else if (DriverUtils.isMySQLFamily(driver)) {
    return " LOCK IN SHARE MODE"
} else if (driver.options.type === "oracle") {
    // ...
}
```

**After:**

```typescript
return this.connection.driver.buildLocking('share', tables, { onLock });

// In PostgresDriver:
buildLocking(mode: LockMode, tables?: string[], options?: LockOptions): string {
    const tablesClause = tables?.length ? ` OF ${tables.join(', ')}` : '';
    const onLock = options?.onLock ? ` ${options.onLock}` : '';

    switch (mode) {
        case 'share': return ` FOR SHARE${tablesClause}${onLock}`;
        case 'update': return ` FOR UPDATE${tablesClause}${onLock}`;
        case 'key_share': return ` FOR KEY SHARE${tablesClause}${onLock}`;
        // ...
    }
}

// In MysqlDriver:
buildLocking(mode: LockMode): string {
    switch (mode) {
        case 'share': return ' LOCK IN SHARE MODE';
        case 'update': return ' FOR UPDATE';
        // ...
    }
}
```

---

### 4.4 Before/After: String Aggregation

**Before:**

```typescript
if (DriverUtils.isMySQLFamily(driver)) {
    return `GROUP_CONCAT(${column} SEPARATOR ${separator})`
} else if (DriverUtils.isPostgresFamily(driver)) {
    return `STRING_AGG(${column}, ${separator})`
}
```

**After:**

```typescript
return this.connection.driver.buildStringAgg(column, separator);

// Each driver implements its own:
// MysqlDriver:
buildStringAgg(column: string, separator: string): string {
    return `GROUP_CONCAT(${column} SEPARATOR '${separator}')`;
}

// PostgresDriver:
buildStringAgg(column: string, separator: string, orderBy?: string): string {
    const order = orderBy ? ` ORDER BY ${orderBy}` : '';
    return `STRING_AGG(${column}, '${separator}'${order})`;
}
```

---

## Part 5: Custom Driver Registration Example

```typescript
// my-custom-driver.ts
import { Driver, DriverRegistry, DriverCapabilities, DataSource } from "typeorm"

class MyCustomDriver implements Driver {
    capabilities: DriverCapabilities = {
        dialect: {
            pagination: "LIMIT_OFFSET",
            stringAggregation: "STRING_AGG",
            booleanType: "NATIVE",
            identifierQuote: '"',
            parameterStyle: "POSITIONAL_DOLLAR",
            distinctOn: true,
            useIndexHint: false,
            maxExecutionTimeHint: false,
            dummyTableName: null,
            currentTimestampExpression: "CURRENT_TIMESTAMP",
        },
        dml: {
            upsert: {
                styles: ["ON_CONFLICT"],
                conflictTarget: true,
                conflictWhere: true,
                doNothing: true,
            },
            returning: {
                insert: true,
                update: true,
                delete: true,
                style: "RETURNING",
                requiresInto: false,
            },
            // ... rest of capabilities
        },
        ddl: {
            indexes: {
                types: ["BTREE", "HASH", "GIN"],
                defaultType: "BTREE",
                fulltext: true,
                spatial: true,
                partial: true,
                expression: true,
                concurrent: true,
            },
            // ...
        },
        transactions: {
            support: "nested",
            savepoints: true,
            isolationLevels: ["READ COMMITTED", "SERIALIZABLE"],
            readOnly: true,
            deferrable: true,
        },
        cte: {
            enabled: true,
            recursive: true,
            requiresRecursiveKeyword: true,
            writable: true,
            materializedHint: true,
            notMaterializedHint: true,
        },
        locking: {
            forUpdate: true,
            forShare: true,
            forKeyShare: true,
            forNoKeyUpdate: true,
            skipLocked: true,
            nowait: true,
            ofTables: true,
        },
    }

    // Implement driver methods...
    buildPagination(limit?: number, offset?: number): string {
        // Custom implementation
    }

    // ... rest of Driver interface
}

// Register before creating DataSource
DriverRegistry.register("my-custom-db", MyCustomDriver)

// Now can use:
const dataSource = new DataSource({
    type: "my-custom-db" as DatabaseType,
    // ...
})
```

---

## Part 6: Migration Path

### Phase 1: Add Capabilities (Non-Breaking)

1. Add `DriverCapabilities` interface
2. Add `capabilities` property to `Driver` interface (optional initially)
3. Implement for all built-in drivers
4. Add SQL building methods with default implementations

### Phase 2: Deprecate Old Patterns

1. Mark `DriverUtils.is*Family()` as deprecated
2. Mark direct `driver.options.type` checks as code smell in linting
3. Provide codemod to migrate family checks to capability checks
4. Update documentation

### Phase 3: Refactor Core

1. Update all query builders to use capabilities
2. Update schema builder
3. Update metadata builders
4. Add DriverRegistry

### Phase 4: Remove Deprecated Code

1. Remove `is*Family` functions
2. Make `capabilities` required in Driver interface
3. Remove redundant properties (`treeSupport`, etc.)

---

## Part 7: Benefits Summary

| Aspect               | Before                              | After                              |
| -------------------- | ----------------------------------- | ---------------------------------- |
| Adding custom driver | Modify 5+ core files                | Register once, implement interface |
| Family membership    | Hardcoded arrays                    | Driver declares capabilities       |
| Feature detection    | String comparison                   | Boolean/enum check                 |
| SQL generation       | Switch statements in query builders | Driver provides methods            |
| Index types          | Only Postgres                       | All drivers can declare            |
| Type safety          | Limited (string literals)           | Full (capability interfaces)       |
| Testability          | Hard to mock                        | Easy to mock capabilities          |

---

## Part 8: Index Types - Complete Support

### 8.1 Expanded Index Types

```typescript
export type IndexType =
    // Universal
    | "BTREE"
    | "HASH"
    // PostgreSQL
    | "GIN"
    | "GIST"
    | "SPGIST"
    | "BRIN"
    // MySQL/MariaDB
    | "FULLTEXT"
    | "SPATIAL"
    | "RTREE"
    // MSSQL
    | "CLUSTERED"
    | "NONCLUSTERED"
    | "COLUMNSTORE"
    | "XML"
    // Oracle
    | "BITMAP"
    | "FUNCTION_BASED"
    // Custom
    | (string & {})
```

### 8.2 Driver Declarations

```typescript
// PostgresDriver
capabilities.ddl.indexes = {
    types: ["BTREE", "HASH", "GIN", "GIST", "SPGIST", "BRIN"],
    defaultType: "BTREE",
    fulltext: true, // via GIN/GIST with tsvector
    spatial: true, // via GIST
    partial: true,
    expression: true,
    concurrent: true,
}

// MysqlDriver
capabilities.ddl.indexes = {
    types: ["BTREE", "HASH", "FULLTEXT", "SPATIAL", "RTREE"],
    defaultType: "BTREE",
    fulltext: true,
    spatial: true,
    partial: false,
    expression: true, // MySQL 8.0+
    concurrent: false,
}

// SqlServerDriver
capabilities.ddl.indexes = {
    types: ["CLUSTERED", "NONCLUSTERED", "COLUMNSTORE", "XML", "HASH"],
    defaultType: "NONCLUSTERED",
    fulltext: true, // separate fulltext catalog
    spatial: true,
    partial: true, // filtered indexes
    expression: false,
    concurrent: true, // ONLINE = ON
}
```

---

## Conclusion

This proposal transforms TypeORM's driver system from an **identity-based** model (checking "is this MySQL?") to a **capability-based** model (checking "does this support X?"). This enables:

1. **True extensibility**: Custom drivers without modifying core code
2. **Reduced maintenance**: No hardcoded type lists to update
3. **Better type safety**: Structured capability declarations
4. **Cleaner code**: SQL generation in drivers, not scattered conditionals
5. **Complete feature support**: All drivers can declare index types, etc.

The migration can be done incrementally with full backward compatibility during the transition period.
