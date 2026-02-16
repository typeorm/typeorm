# TypeORM Dialect/Driver-Specific Checks Report

This report catalogs all dialect/driver-specific checks in the TypeORM codebase to support the design of a custom driver/dialect type system.

---

## Part 1: Core Extension Points (Registries)

These are the files that would need modification to register a new custom driver:

### 1.1 DatabaseType Definition

**File:** `src/driver/types/DatabaseType.ts`

```typescript
export type DatabaseType =
    | "mysql"
    | "postgres"
    | "cockroachdb"
    | "sap"
    | "mariadb"
    | "sqlite"
    | "cordova"
    | "react-native"
    | "nativescript"
    | "sqljs"
    | "oracle"
    | "mssql"
    | "mongodb"
    | "aurora-mysql"
    | "aurora-postgres"
    | "expo"
    | "better-sqlite3"
    | "capacitor"
    | "spanner"
```

### 1.2 Driver Factory

**File:** `src/driver/DriverFactory.ts`

Switch statement that instantiates drivers based on `type`. A custom driver would need a new case added here.

### 1.3 Driver Families (DriverUtils)

**File:** `src/driver/DriverUtils.ts`

Three family groupings used throughout the codebase:

| Family       | Members                                                                                             |
| ------------ | --------------------------------------------------------------------------------------------------- |
| **SQLite**   | `sqlite`, `cordova`, `react-native`, `nativescript`, `sqljs`, `expo`, `better-sqlite3`, `capacitor` |
| **MySQL**    | `mysql`, `mariadb`                                                                                  |
| **Postgres** | `postgres`, `aurora-postgres`, `cockroachdb`                                                        |

### 1.4 Platform Package Loading

**File:** `src/platform/PlatformTools.ts`

The `load()` method contains explicit package mappings for each driver's underlying library (e.g., `mysql2`, `pg`, `oracledb`, `mongodb`, etc.). Custom drivers requiring new npm packages would need entries here.

### 1.5 Entity Manager Factory

**File:** `src/entity-manager/EntityManagerFactory.ts`

Returns specialized managers for `mongodb` (MongoEntityManager) and `sqljs` (SqljsEntityManager). Other types get the standard EntityManager.

---

## Part 2: Driver Interface & Capability Properties

Each driver must implement the `Driver` interface (`src/driver/Driver.ts`). Key capability properties:

| Property                      | Description                           | Varies By Driver                                                                                                                 |
| ----------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `treeSupport`                 | Whether tree structures are supported | MongoDB: `false`, all others: `true`                                                                                             |
| `transactionSupport`          | `"simple"` / `"nested"` / `"none"`    | Cordova/Spanner/MongoDB: `none`; MSSQL/SAP: `simple`; others: `nested`                                                           |
| `supportedUpsertTypes`        | Array of supported upsert strategies  | Postgres family: `on-conflict-do-update`; MySQL family: `on-duplicate-key-update`; MSSQL/Oracle/SAP: `merge-into`; Spanner: none |
| `supportedDataTypes`          | Database-specific column types        | Fully driver-dependent                                                                                                           |
| `mappedDataTypes`             | ORM internal column type mappings     | Driver-dependent                                                                                                                 |
| `maxAliasLength`              | Max identifier length                 | Oracle: 29; Postgres/MySQL/Spanner: 63; MSSQL/SAP: 128                                                                           |
| `parametersPrefix`            | SQL parameter prefix                  | `$` (Postgres), `@` (MSSQL/Spanner), `:` (Oracle)                                                                                |
| `cteCapabilities`             | CTE support flags                     | Varies; MySQL requires version check                                                                                             |
| `isReturningSqlSupported()`   | RETURNING/OUTPUT clause support       | Oracle/Postgres/Cockroach/MSSQL: yes; MySQL: limited (MariaDB insert/delete)                                                     |
| `isUUIDGenerationSupported()` | Native UUID generation                | Driver-dependent                                                                                                                 |

---

## Part 3: Checks by File

### Query Builder Layer

#### `src/query-builder/SelectQueryBuilder.ts`

| Line(s)    | Check                                      | Purpose                                    |
| ---------- | ------------------------------------------ | ------------------------------------------ |
| 1340       | `=== "cockroachdb"`                        | Disable FOR UPDATE for CockroachDB         |
| 2230, 2285 | `isMySQLFamily`                            | GROUP BY handling                          |
| 2291       | `isPostgresFamily`                         | SELECT handling                            |
| 2620, 2693 | `=== "mssql"`                              | OFFSET/FETCH syntax                        |
| 2650-2652  | `=== "aurora-mysql"`, `"sap"`, `"spanner"` | LIMIT clause variations                    |
| 2658       | `isSQLiteFamily`                           | LIMIT clause syntax                        |
| 2663       | `=== "oracle"`                             | ROWNUM-based pagination                    |
| 2718-2814  | Multiple checks                            | UNION/INTERSECT/EXCEPT support per dialect |
| 2912-2913  | `isMySQLFamily`, `"aurora-mysql"`          | DISTINCT handling                          |
| 2931       | `=== "mssql"`                              | Alias output prefix                        |
| 3007-3008  | `=== "cockroachdb"`, `isPostgresFamily`    | FOR UPDATE syntax                          |
| 3024       | `isMySQLFamily`                            | GROUP_CONCAT vs STRING_AGG                 |
| 3039       | `=== "mssql"`                              | TOP keyword                                |
| 3061       | `=== "spanner"`                            | Spanner-specific query building            |
| 4385       | `=== "mssql"`                              | Escape handling                            |

#### `src/query-builder/InsertQueryBuilder.ts`

| Line(s)   | Check                                        | Purpose                                                    |
| --------- | -------------------------------------------- | ---------------------------------------------------------- |
| 129, 145  | `=== "oracle"`, `"mssql"`                    | INSERT statement structure                                 |
| 468-1022  | Multiple                                     | Upsert (ON CONFLICT, ON DUPLICATE KEY, MERGE INTO) routing |
| 481       | `=== "oracle"`                               | Sequence-based insert                                      |
| 493-515   | `isMySQLFamily`, `"aurora-mysql"`            | VALUES syntax                                              |
| 527-546   | `=== "mssql"`, `"oracle"`, `"sap"`           | IDENTITY_INSERT handling                                   |
| 638, 946  | `isSQLiteFamily`                             | SQLite upsert syntax                                       |
| 730-740   | `=== "cockroachdb"`, `"spanner"`, `"oracle"` | RETURNING clause support                                   |
| 748-812   | Multiple MSSQL checks                        | OUTPUT clause structure                                    |
| 1196-1399 | Many MSSQL checks                            | Identity column handling                                   |
| 1586-1659 | `"oracle"`, `"sap"`, `"spanner"`, `"mssql"`  | Bulk insert variations                                     |

#### `src/query-builder/UpdateQueryBuilder.ts`

| Line(s)  | Check                               | Purpose                   |
| -------- | ----------------------------------- | ------------------------- |
| 130      | `=== "mssql"`                       | UPDATE FROM syntax        |
| 544-601  | `"sap"`, `"spanner"`, `"mssql"`     | UPDATE with JOIN syntax   |
| 662-663  | `"sap"`, `"spanner"`                | Update restrictions       |
| 693, 700 | `"mssql"`, `"spanner"`              | Returning clause behavior |
| 565, 588 | `isMySQLFamily`, `isPostgresFamily` | Column reference syntax   |
| 755-756  | `isMySQLFamily`, `"aurora-mysql"`   | Limit clause in UPDATE    |

#### `src/query-builder/DeleteQueryBuilder.ts`

| Line(s) | Check           | Purpose                 |
| ------- | --------------- | ----------------------- |
| 289     | `=== "mssql"`   | DELETE statement syntax |
| 292     | `=== "spanner"` | Spanner delete handling |

#### `src/query-builder/SoftDeleteQueryBuilder.ts`

| Line(s) | Check           | Purpose                |
| ------- | --------------- | ---------------------- |
| 515     | `=== "mssql"`   | Output clause handling |
| 568     | `isMySQLFamily` | Soft delete syntax     |

#### `src/query-builder/QueryBuilder.ts`

| Line(s)   | Check                         | Purpose                          |
| --------- | ----------------------------- | -------------------------------- |
| 934, 970  | `=== "mssql"`                 | RETURNING/OUTPUT clause prefix   |
| 955       | `=== "oracle"`                | INTO clause for RETURNING        |
| 1099-1100 | `"postgres"`, `"cockroachdb"` | CTE column syntax                |
| 1118      | `=== "cockroachdb"`           | CTE restrictions                 |
| 1151-1200 | `cteCapabilities`             | CTE recursive/materialized hints |

#### `src/query-builder/ReturningResultsEntityUpdator.ts`

| Line(s) | Check          | Purpose                  |
| ------- | -------------- | ------------------------ |
| 44      | `=== "mssql"`  | Result set handling      |
| 160     | `=== "oracle"` | OUT parameter binding    |
| 174     | `=== "mssql"`  | Identity value retrieval |

#### `src/query-builder/RelationUpdater.ts`

| Line(s) | Check               | Purpose                      |
| ------- | ------------------- | ---------------------------- |
| 164-165 | `"oracle"`, `"sap"` | Relation update restrictions |

---

### Schema Builder Layer

#### `src/schema-builder/RdbmsSchemaBuilder.ts`

| Line(s)                          | Check                                          | Purpose                               |
| -------------------------------- | ---------------------------------------------- | ------------------------------------- |
| 74-75                            | `!== "cockroachdb"`, `!== "spanner"`           | Schema synchronization modes          |
| 453, 552, 595, 1147              | `=== "postgres"`                               | PostgreSQL-specific schema operations |
| 489-490, 594, 914-916, 1073-1074 | `isMySQLFamily`, `"aurora-mysql"`, `"spanner"` | MySQL/Aurora DDL behavior             |
| 1011-1012                        | `!== "postgres"`, `!isPostgresFamily`          | Extension handling                    |
| 1364                             | `=== "spanner"`                                | Primary key requirements              |

---

### Metadata Layer

#### `src/metadata-builder/EntityMetadataBuilder.ts`

| Line(s) | Check                                                       | Purpose                           |
| ------- | ----------------------------------------------------------- | --------------------------------- |
| 195-232 | Multiple (`"mssql"`, `"cockroachdb"`, `"sap"`, `"spanner"`) | Default value generation strategy |
| 264     | `=== "mssql"`                                               | Identity column handling          |
| 777     | `=== "postgres"`                                            | Postgres-specific metadata        |
| 785     | `=== "cockroachdb"`                                         | CockroachDB-specific metadata     |
| 817-820 | `isMySQLFamily`, `"aurora-mysql"`, `"sap"`, `"spanner"`     | Auto-increment behavior           |

#### `src/metadata-builder/JunctionEntityMetadataBuilder.ts`

| Line(s) | Check                      | Purpose                           |
| ------- | -------------------------- | --------------------------------- |
| 100-171 | `isMySQLFamily`, `"mssql"` | Junction table column types       |
| 233-256 | `"spanner"`, `"oracle"`    | Primary key generation strategies |

#### `src/metadata-builder/RelationJoinColumnBuilder.ts`

| Line(s) | Check                      | Purpose                   |
| ------- | -------------------------- | ------------------------- |
| 207-210 | `isMySQLFamily`, `"mssql"` | Foreign key column sizing |

#### `src/metadata-builder/ClosureJunctionEntityMetadataBuilder.ts`

| Line(s)  | Check         | Purpose                 |
| -------- | ------------- | ----------------------- |
| 158, 168 | `=== "mssql"` | Closure table structure |

#### `src/metadata-builder/EntityMetadataValidator.ts`

| Line(s) | Check                             | Purpose                     |
| ------- | --------------------------------- | --------------------------- |
| 125     | `!== "mongodb"`                   | Skip validation for MongoDB |
| 157-158 | `isMySQLFamily`, `"aurora-mysql"` | MySQL-specific validation   |
| 173     | `isMySQLFamily`                   | Character set validation    |
| 181     | `=== "mssql"`                     | MSSQL constraints           |
| 192     | `=== "postgres"`                  | Postgres enum validation    |

#### `src/metadata/ColumnMetadata.ts`

| Line(s) | Check           | Purpose                            |
| ------- | --------------- | ---------------------------------- |
| 1024    | `=== "mongodb"` | Skip column validation for MongoDB |

#### `src/metadata/EmbeddedMetadata.ts`

| Line(s) | Check           | Purpose                    |
| ------- | --------------- | -------------------------- |
| 262     | `=== "mongodb"` | Embedded document handling |

#### `src/metadata/EntityMetadata.ts`

| Line(s)   | Check            | Purpose          |
| --------- | ---------------- | ---------------- |
| 1028-1031 | `maxAliasLength` | Alias truncation |

---

### Persistence Layer

#### `src/persistence/SubjectExecutor.ts`

| Line(s)      | Check               | Purpose                 |
| ------------ | ------------------- | ----------------------- |
| 367          | `=== "mongodb"`     | MongoDB-specific insert |
| 387, 401-403 | `"oracle"`, `"sap"` | Single vs bulk insert   |

#### `src/persistence/SubjectDatabaseEntityLoader.ts`

| Line(s) | Check           | Purpose                |
| ------- | --------------- | ---------------------- |
| 110     | `=== "mongodb"` | MongoDB entity loading |

#### `src/persistence/tree/ClosureSubjectExecutor.ts`

| Line(s) | Check         | Purpose                 |
| ------- | ------------- | ----------------------- |
| 325     | `!== "mssql"` | Closure tree CTE syntax |

#### `src/persistence/EntityPersistExecutor.ts`

| Line(s) | Check                           | Purpose              |
| ------- | ------------------------------- | -------------------- |
| 170     | `transactionSupport !== "none"` | Transaction wrapping |

---

### Migration & Cache

#### `src/migration/MigrationExecutor.ts`

| Line(s)                 | Check                             | Purpose                         |
| ----------------------- | --------------------------------- | ------------------------------- |
| 108, 509, 560, 677, 720 | `=== "mongodb"` / `!== "mongodb"` | Skip SQL migrations for MongoDB |
| 659, 701                | `=== "mssql"`                     | MSSQL parameter handling        |

#### `src/cache/DbQueryResultCache.ts`

| Line(s)  | Check           | Purpose                      |
| -------- | --------------- | ---------------------------- |
| 85       | `=== "spanner"` | Cache ID generation strategy |
| 157, 180 | `=== "mssql"`   | MssqlParameter wrapper usage |
| 164, 254 | `=== "oracle"`  | LOB comparison               |
| 268      | `=== "spanner"` | Spanner delete handling      |

---

### Data Source & Repository

#### `src/data-source/DataSource.ts`

| Line(s)  | Check                                                          | Purpose                  |
| -------- | -------------------------------------------------------------- | ------------------------ |
| 183      | `isMongoEntityManager`                                         | mongoManager accessor    |
| 197      | `isSqljsEntityManager`                                         | sqljsManager accessor    |
| 353-356  | `"mssql"`, `isMySQLFamily`, `"aurora-mysql"`, `isSQLiteFamily` | dropDatabase behavior    |
| 482      | `!== "mongodb"`                                                | getMongoRepository guard |
| 532, 589 | `isMongoEntityManager`                                         | Query execution guards   |

#### `src/repository/TreeRepository.ts`

| Line(s)  | Check            | Purpose                       |
| -------- | ---------------- | ----------------------------- |
| 221, 395 | `isSQLiteFamily` | SQLite recursive CTE handling |

#### `src/entity-manager/EntityManager.ts`

| Line(s)   | Check                     | Purpose                       |
| --------- | ------------------------- | ----------------------------- |
| 759       | `supportedUpsertTypes[0]` | Default upsert type selection |
| 1446-1447 | `=== "mongodb"`           | MongoRepository creation      |
| 1475      | `treeSupport === false`   | Tree operation guard          |

---

### Driver-Specific Query Runners

Each driver has its own QueryRunner with version-specific checks:

#### `src/driver/mysql/MysqlQueryRunner.ts`

| Line(s)    | Check                                                | Purpose                 |
| ---------- | ---------------------------------------------------- | ----------------------- |
| 2569, 3355 | `=== "mariadb"`                                      | MariaDB-specific syntax |
| 3408-3409  | `=== "mysql"` + `isReleaseVersionOrGreater("8.0.0")` | MySQL 8 features        |

#### `src/driver/mysql/MysqlDriver.ts`

| Line(s)  | Check                           | Purpose                      |
| -------- | ------------------------------- | ---------------------------- |
| 400-415  | `=== "mariadb"` / `=== "mysql"` | RETURNING support by version |
| 408, 415 | Version checks                  | CTE enablement               |
| 734      | `=== "mariadb"`                 | Column type handling         |

#### `src/driver/postgres/PostgresQueryRunner.ts`

| Line(s) | Check                              | Purpose                   |
| ------- | ---------------------------------- | ------------------------- |
| 3211    | `isReleaseVersionOrGreater("9.3")` | Materialized view support |

#### `src/driver/sap/SapDriver.ts`

| Line(s)  | Check                              | Purpose               |
| -------- | ---------------------------------- | --------------------- |
| 651, 855 | `isReleaseVersionOrGreater("4.0")` | SAP HANA 4.0 features |

---

## Part 4: Checks by Dialect/Driver

### mongodb

- **Primary check locations:** MigrationExecutor, SubjectExecutor, EntityManager, DataSource, EntityMetadataValidator, ColumnMetadata, EmbeddedMetadata, EntityManagerFactory, SubjectDatabaseEntityLoader
- **Pattern:** Usually `=== "mongodb"` to branch into document-database specific logic or skip SQL-based operations
- **Special managers:** MongoEntityManager, MongoRepository

### mssql

- **Primary check locations:** InsertQueryBuilder (18+ occurrences), QueryBuilder, SelectQueryBuilder, UpdateQueryBuilder, DeleteQueryBuilder, SoftDeleteQueryBuilder, MigrationExecutor, DbQueryResultCache, ClosureSubjectExecutor, EntityMetadataBuilder
- **Key behaviors:** OUTPUT clause syntax, IDENTITY_INSERT, TOP keyword, @@IDENTITY retrieval, MssqlParameter wrapper

### oracle

- **Primary check locations:** InsertQueryBuilder (15+ occurrences), QueryBuilder, SelectQueryBuilder, JunctionEntityMetadataBuilder, RelationUpdater, SubjectExecutor, DbQueryResultCache
- **Key behaviors:** RETURNING INTO clause, ROWNUM pagination, sequence-based insert, LOB comparison, dual table

### spanner

- **Primary check locations:** RdbmsSchemaBuilder, InsertQueryBuilder, UpdateQueryBuilder, DeleteQueryBuilder, SelectQueryBuilder, JunctionEntityMetadataBuilder, EntityMetadataBuilder, DbQueryResultCache
- **Key behaviors:** No transaction support, UUID generation required for PKs, limited upsert support, specific interleaved tables

### sap (HANA)

- **Primary check locations:** InsertQueryBuilder, UpdateQueryBuilder, SelectQueryBuilder, RelationUpdater, SubjectExecutor, EntityMetadataBuilder
- **Key behaviors:** MERGE INTO upsert, simple transaction support, version-gated features (4.0+)

### cockroachdb

- **Primary check locations:** SelectQueryBuilder, QueryBuilder, InsertQueryBuilder, RdbmsSchemaBuilder, EntityMetadataBuilder
- **Key behaviors:** PostgreSQL-compatible with restrictions (no FOR UPDATE), specific CTE handling

### mysql / mariadb (isMySQLFamily)

- **Primary check locations:** SelectQueryBuilder, InsertQueryBuilder, UpdateQueryBuilder, SoftDeleteQueryBuilder, RdbmsSchemaBuilder, EntityMetadataBuilder, EntityMetadataValidator, TreeRepository, MysqlQueryRunner
- **Key behaviors:** GROUP_CONCAT, ON DUPLICATE KEY UPDATE, LIMIT in UPDATE/DELETE, version-gated RETURNING (MariaDB)

### postgres / aurora-postgres (isPostgresFamily)

- **Primary check locations:** SelectQueryBuilder, InsertQueryBuilder, UpdateQueryBuilder, QueryBuilder, RdbmsSchemaBuilder, EntityMetadataValidator
- **Key behaviors:** ON CONFLICT upsert, RETURNING clause, DISTINCT ON, array types, materialized views (9.3+)

### sqlite family (isSQLiteFamily)

- **Primary check locations:** SelectQueryBuilder, InsertQueryBuilder, DataSource, TreeRepository, AbstractSqliteQueryRunner
- **Key behaviors:** ON CONFLICT upsert, no nested transactions in some variants, recursive CTE limitations

### sqljs

- **Primary check locations:** EntityManagerFactory
- **Special managers:** SqljsEntityManager (for in-memory DB save/load)

### aurora-mysql

- **Primary check locations:** SelectQueryBuilder, InsertQueryBuilder, RdbmsSchemaBuilder, EntityMetadataBuilder
- **Pattern:** Usually grouped with MySQL family but sometimes has additional restrictions

---

## Part 5: Feature Support Matrix

| Feature             | postgres    | mysql        | mariadb      | mssql      | oracle     | spanner | sap        | sqlite      | mongodb | cockroachdb             |
| ------------------- | ----------- | ------------ | ------------ | ---------- | ---------- | ------- | ---------- | ----------- | ------- | ----------------------- |
| Tree support        | Yes         | Yes          | Yes          | Yes        | Yes        | Yes     | Yes        | Yes         | No      | Yes                     |
| Nested transactions | Yes         | Yes          | Yes          | No         | Yes        | No      | No         | Yes\*       | No      | Yes                     |
| RETURNING (insert)  | Yes         | No           | Yes\*\*      | Yes        | Yes        | No      | No         | No          | N/A     | Yes                     |
| RETURNING (update)  | Yes         | No           | No           | Yes        | Yes        | No      | No         | No          | N/A     | Yes                     |
| RETURNING (delete)  | Yes         | No           | Yes\*\*      | Yes        | Yes        | No      | No         | No          | N/A     | Yes                     |
| Upsert type         | on-conflict | on-duplicate | on-duplicate | merge-into | merge-into | None    | merge-into | on-conflict | N/A     | on-conflict/primary-key |
| CTE support         | Yes         | 8.0+         | 10.2+        | Yes        | Yes        | Yes     | Yes        | 3.8+        | N/A     | Yes                     |
| Max alias length    | 63          | 63           | 63           | 128        | 29         | 63      | 128        | None        | N/A     | None                    |

\*SQLite variants vary; Cordova has `none`
\*\*MariaDB 10.5+

---

## Part 6: Recommendations for Custom Driver Type System

### Required Extension Points

1. **Type registration:** Extend `DatabaseType` union type
2. **Factory registration:** Add case to `DriverFactory.create()`
3. **Family membership:** Add to appropriate `DriverUtils.is*Family()` if applicable
4. **Package loading:** Add to `PlatformTools.load()` if using external npm package

### Driver Interface Implementation

Custom drivers must implement all methods in `src/driver/Driver.ts`:

- Set capability flags (`treeSupport`, `transactionSupport`, `supportedUpsertTypes`, etc.)
- Implement `isReturningSqlSupported()` for insert/update/delete
- Define `mappedDataTypes` and `supportedDataTypes`
- Create corresponding QueryRunner class

### Considerations for Extensibility

1. **Replace string literal checks** with interface method checks where possible
2. **Use capability flags** instead of type comparisons for feature detection
3. **Consider a driver registry pattern** instead of hardcoded switch/if statements
4. **Family membership should be opt-in** via driver interface, not hardcoded arrays
5. **Version checks should be encapsulated** in driver methods, not scattered in query builders

---

_Report generated from TypeORM source analysis_
