# TypeORM 1.0 Release Notes

TypeORM 1.0 is a major release that removes long-deprecated APIs, modernizes platform requirements, and ships dozens of bug fixes and new features accumulated during the 0.3.x cycle.

## Breaking changes

> See the [Migration Guide](./8-migration-v1.md) for detailed upgrade instructions.

### Platform requirements

- **Node.js 20+ required** — support for Node.js 16 and 18 has been dropped, and the minimum JavaScript target is now ES2023 ([#11382](https://github.com/typeorm/typeorm/pull/11382) by [@alumni](https://github.com/alumni))
- **`Buffer` polyfill removed** — `Uint8Array` is now used for binary data on non-Node platforms; Node.js `Buffer` (which extends `Uint8Array`) continues to work as before ([#11935](https://github.com/typeorm/typeorm/pull/11935) by [@pujux](https://github.com/pujux))
- **Glob library replaced** — `glob` has been replaced with `tinyglobby` and `rimraf` has been removed, resulting in fewer dependencies ([#11699](https://github.com/typeorm/typeorm/pull/11699) by [@alumni](https://github.com/alumni))
- **Hashing moved to native `crypto`** — the `sha.js` and `uuid` packages have been replaced with the native `crypto` module and `crypto.randomUUID()` ([#11864](https://github.com/typeorm/typeorm/pull/11864) by [@G0maa](https://github.com/G0maa), [#11769](https://github.com/typeorm/typeorm/pull/11769) by [@mag123c](https://github.com/mag123c))

### Driver changes

- **MySQL / MariaDB: `mysql` package dropped** — only `mysql2` is supported; the `connectorPackage` option has been removed ([#11766](https://github.com/typeorm/typeorm/pull/11766) by [@pkuczynski](https://github.com/pkuczynski))
- **MySQL: `legacySpatialSupport` now defaults to `false`** — standard `ST_GeomFromText`/`ST_AsText` functions are used by default ([#12083](https://github.com/typeorm/typeorm/pull/12083) by [@pkuczynski](https://github.com/pkuczynski))
- **MySQL: `width` and `zerofill` column options removed** — these were deprecated in MySQL 8.0.17 and removed in MySQL 8.4 ([#12084](https://github.com/typeorm/typeorm/pull/12084) by [@pkuczynski](https://github.com/pkuczynski))
- **SQLite: `sqlite3` dropped, `better-sqlite3` is the default** — the `sqlite3` package is no longer supported; `flags` and `busyTimeout` options have been removed ([#11836](https://github.com/typeorm/typeorm/pull/11836) by [@pkuczynski](https://github.com/pkuczynski))
- **MongoDB: driver v7+ required** — support for MongoDB Node.js driver v5/v6 has been dropped; `stats()` method removed; deprecated connection options removed; internal types are no longer exported ([#12208](https://github.com/typeorm/typeorm/pull/12208) by [@naorpeled](https://github.com/naorpeled), [#12179](https://github.com/typeorm/typeorm/pull/12179) by [@pkuczynski](https://github.com/pkuczynski), [#12120](https://github.com/typeorm/typeorm/pull/12120) by [@pkuczynski](https://github.com/pkuczynski), [#12037](https://github.com/typeorm/typeorm/pull/12037) by [@alumni](https://github.com/alumni))
- **MS SQL Server: `domain` connection option removed** — use `authentication` with NTLM type instead ([#12135](https://github.com/typeorm/typeorm/pull/12135) by [@pkuczynski](https://github.com/pkuczynski))
- **SAP HANA: deprecated connection aliases removed** — `hanaClientDriver`, `pool.max`, `pool.requestTimeout`, `pool.idleTimeout`, and others have been removed in favor of their modern equivalents ([#12080](https://github.com/typeorm/typeorm/pull/12080) by [@gioboa](https://github.com/gioboa))
- **Expo: legacy driver removed** — the legacy Expo SQLite driver has been removed; use Expo SDK v52+ with the modern async API ([#11860](https://github.com/typeorm/typeorm/pull/11860) by [@G0maa](https://github.com/G0maa))
- **Redis: legacy client support removed** — only modern Redis client (v4+) is supported for query result caching ([#12057](https://github.com/typeorm/typeorm/pull/12057) by [@G0maa](https://github.com/G0maa))

### Removed APIs

- **`Connection` and `ConnectionOptions` removed** — use `DataSource` and `DataSourceOptions` instead ([#12022](https://github.com/typeorm/typeorm/pull/12022) by [@alumni](https://github.com/alumni))
- **`ConnectionManager` and global convenience functions removed** — `createConnection`, `getConnection`, `getManager`, `getRepository`, `createQueryBuilder`, and other globals have been removed ([#12098](https://github.com/typeorm/typeorm/pull/12098) by [@michaelbromley](https://github.com/michaelbromley))
- **`getMongoRepository` and `getMongoManager` globals removed** — use `dataSource.getMongoRepository()` and `dataSource.mongoManager` instead ([#12099](https://github.com/typeorm/typeorm/pull/12099) by [@pkuczynski](https://github.com/pkuczynski))
- **`DataSource.name` removed** — named connections were deprecated in v0.3; `ConnectionOptionsReader.all()` renamed to `get()` ([#12136](https://github.com/typeorm/typeorm/pull/12136) by [@pkuczynski](https://github.com/pkuczynski))
- **`TYPEORM_*` environment variable support removed** — `ConnectionOptionsEnvReader`, `ormconfig.env`, and `dotenv` auto-loading have been removed ([#12134](https://github.com/typeorm/typeorm/pull/12134) by [@pkuczynski](https://github.com/pkuczynski))
- **`findByIds` removed** — use `findBy` with `In` operator instead ([#12114](https://github.com/typeorm/typeorm/pull/12114) by [@pkuczynski](https://github.com/pkuczynski))
- **`Repository.exist()` removed** — use `Repository.exists()` instead ([#12131](https://github.com/typeorm/typeorm/pull/12131) by [@pkuczynski](https://github.com/pkuczynski))
- **`AbstractRepository`, `@EntityRepository`, and `getCustomRepository` removed** — use `Repository.extend()` instead ([#12096](https://github.com/typeorm/typeorm/pull/12096) by [@pkuczynski](https://github.com/pkuczynski))
- **`@RelationCount` decorator removed** — use `@VirtualColumn` with a sub-query instead ([#12181](https://github.com/typeorm/typeorm/pull/12181) by [@pkuczynski](https://github.com/pkuczynski))
- **IoC container system removed** — `useContainer()`, `getFromContainer()`, and related types have been removed ([#12180](https://github.com/typeorm/typeorm/pull/12180) by [@pkuczynski](https://github.com/pkuczynski))
- **`readonly` column option removed** — use `update: false` instead ([#12132](https://github.com/typeorm/typeorm/pull/12132) by [@pkuczynski](https://github.com/pkuczynski))
- **`unsigned` on `ColumnNumericOptions` removed** — only affected decimal/float types; integer `unsigned` is unchanged ([#12133](https://github.com/typeorm/typeorm/pull/12133) by [@pkuczynski](https://github.com/pkuczynski))
- **QueryBuilder: `onConflict()`, deprecated `orUpdate()` overload, and `setNativeParameters()` removed** — use `orIgnore()`/`orUpdate()` array signature and `setParameters()` instead ([#12090](https://github.com/typeorm/typeorm/pull/12090) by [@pkuczynski](https://github.com/pkuczynski))
- **QueryBuilder: `printSql()` renamed to `logQuery()`** ([#12151](https://github.com/typeorm/typeorm/pull/12151) by [@naorpeled](https://github.com/naorpeled))
- **QueryBuilder: `WhereExpression` type alias removed** — use `WhereExpressionBuilder` instead ([#12097](https://github.com/typeorm/typeorm/pull/12097) by [@pkuczynski](https://github.com/pkuczynski))
- **QueryBuilder: `replacePropertyNames()` removed** — it was a no-op ([#12178](https://github.com/typeorm/typeorm/pull/12178) by [@pkuczynski](https://github.com/pkuczynski))
- **Deprecated lock modes removed** — `pessimistic_partial_write` and `pessimistic_write_or_fail` replaced by `pessimistic_write` with `onLocked` option ([#12093](https://github.com/typeorm/typeorm/pull/12093) by [@pkuczynski](https://github.com/pkuczynski))
- **`QueryRunner.loadedTables` and `loadedViews` removed** — use `getTables()` and `getViews()` instead ([#12183](https://github.com/typeorm/typeorm/pull/12183) by [@pkuczynski](https://github.com/pkuczynski))
- **`MigrationExecutor.getAllMigrations()` removed** — use `getMigrations()` instead ([#12142](https://github.com/typeorm/typeorm/pull/12142) by [@pkuczynski](https://github.com/pkuczynski))
- **`EntityMetadata.createPropertyPath()` static method removed** — use the instance method on QueryBuilder instead ([#12141](https://github.com/typeorm/typeorm/pull/12141) by [@pkuczynski](https://github.com/pkuczynski))
- **Internal `nativeParameters` plumbing removed** from drivers and query builders ([#12104](https://github.com/typeorm/typeorm/pull/12104) by [@pkuczynski](https://github.com/pkuczynski))
- **Internal `broadcastLoadEventsForAll()` removed** from Broadcaster ([#12137](https://github.com/typeorm/typeorm/pull/12137) by [@pkuczynski](https://github.com/pkuczynski))
- **Internal `DriverUtils.buildColumnAlias()` removed** — use `buildAlias()` instead ([#12138](https://github.com/typeorm/typeorm/pull/12138) by [@pkuczynski](https://github.com/pkuczynski))

### Behavioral changes

- **`invalidWhereValuesBehavior` defaults to `throw`** — passing `null` or `undefined` in where conditions now throws an error instead of silently ignoring the property; use `IsNull()` for null matching ([#11710](https://github.com/typeorm/typeorm/pull/11710) by [@naorpeled](https://github.com/naorpeled))
- **`invalidWhereValuesBehavior` scoped to high-level APIs only** — QueryBuilder's `.where()`, `.andWhere()`, `.orWhere()` are no longer affected by this setting ([#11878](https://github.com/typeorm/typeorm/pull/11878) by [@naorpeled](https://github.com/naorpeled))

## New features

### Query Builder

- **`INSERT INTO ... SELECT FROM ...`** — new `valuesFromSelect()` method on `InsertQueryBuilder` for data migration and transformation queries ([#11896](https://github.com/typeorm/typeorm/pull/11896) by [@Cprakhar](https://github.com/Cprakhar))
- **`returning` option for update/upsert** — repository and entity manager `update()` and `upsert()` methods now support a `returning` option on databases that support `RETURNING` clauses ([#11782](https://github.com/typeorm/typeorm/pull/11782) by [@naorpeled](https://github.com/naorpeled))
- **`ifExists` parameter on all drop methods** — `dropColumn`, `dropIndex`, `dropPrimaryKey`, `dropForeignKey`, `dropUniqueConstraint`, `dropCheckConstraint`, `dropExclusionConstraint`, and their plural variants now accept an `ifExists` flag ([#12121](https://github.com/typeorm/typeorm/pull/12121) by [@pkuczynski](https://github.com/pkuczynski))
- **Explicit resource management for `QueryRunner`** — supports `await using` syntax (TypeScript 5.2+) for automatic cleanup ([#11701](https://github.com/typeorm/typeorm/pull/11701) by [@alumni](https://github.com/alumni))

### Drivers

- **PostgreSQL: `ADD VALUE` for enum changes** — when adding new enum values, TypeORM now uses the simpler `ALTER TYPE ... ADD VALUE` syntax instead of the 4-step rename-create-migrate-drop approach, when possible ([#10956](https://github.com/typeorm/typeorm/pull/10956) by [@janzipek](https://github.com/janzipek))
- **PostgreSQL: additional extensions** — new `installExtensions` option to install additional PostgreSQL extensions during connection setup ([#11888](https://github.com/typeorm/typeorm/pull/11888) by [@Cprakhar](https://github.com/Cprakhar))
- **PostgreSQL: partial index support** — add support for PostgreSQL partial indices ([#11318](https://github.com/typeorm/typeorm/pull/11318) by [@freePixel](https://github.com/freePixel))
- **SAP HANA: locking in SELECT** — `FOR UPDATE` and other lock modes are now supported in SAP HANA queries ([#11996](https://github.com/typeorm/typeorm/pull/11996) by [@alumni](https://github.com/alumni))
- **SAP HANA: table comments** — `@Entity({ comment: "..." })` now works with SAP HANA ([#11939](https://github.com/typeorm/typeorm/pull/11939) by [@Cprakhar](https://github.com/Cprakhar))
- **SAP HANA: pool timeout** — new `maxWaitTimeoutIfPoolExhausted` pool option ([#11868](https://github.com/typeorm/typeorm/pull/11868) by [@alumni](https://github.com/alumni))
- **SQLite: `jsonb` column type** — SQLite now supports the `jsonb` column type ([#11933](https://github.com/typeorm/typeorm/pull/11933) by [@Cprakhar](https://github.com/Cprakhar))
- **React Native: encryption key** — new option to pass an encryption key for React Native SQLite databases ([#11736](https://github.com/typeorm/typeorm/pull/11736) by [@HtSpChakradharCholleti](https://github.com/HtSpChakradharCholleti))

### Persistence & Upsert

- **Cascade truncate in `clear()`** — `Repository.clear()` and `EntityManager.clear()` now accept `{ cascade: true }` to issue `TRUNCATE ... CASCADE` on PostgreSQL, CockroachDB, and Oracle ([#11866](https://github.com/typeorm/typeorm/pull/11866) by [@Cprakhar](https://github.com/Cprakhar))
- **Better typing for `increment`/`decrement`** — conditions parameter now uses proper entity-aware types instead of `any` ([#11294](https://github.com/typeorm/typeorm/pull/11294) by [@OSA413](https://github.com/OSA413))

### Column types & Decorators

- **Deferrable support on `@Exclusion`** — mirrors the existing deferrable support on `@Unique` and `@Index` ([#11802](https://github.com/typeorm/typeorm/pull/11802) by [@oGAD31](https://github.com/oGAD31))

### Other

- **Improved ormconfig error handling** — loading failures now log warnings instead of silently failing ([#11871](https://github.com/typeorm/typeorm/pull/11871) by [@Cprakhar](https://github.com/Cprakhar))

## Bug fixes

### Query generation

- **Column alias properly escaped in `orderBy`** — prevents SQL errors when alias names conflict with reserved words ([#12027](https://github.com/typeorm/typeorm/pull/12027) by [@Cprakhar](https://github.com/Cprakhar))
- **`addOrderBy` resolves database column names** — using the database column name (e.g., `created_at`) instead of the property name now works correctly ([#11904](https://github.com/typeorm/typeorm/pull/11904) by [@smith-xyz](https://github.com/smith-xyz))
- **Order subquery column resolution** — fixed "Cannot get metadata for given alias" error when ordering by subquery columns ([#11343](https://github.com/typeorm/typeorm/pull/11343) by [@trannhan0810](https://github.com/trannhan0810))
- **`select` column ordering preserved** — `getQuery()`/`getSql()` now returns columns in the order they were added via `select()` and `addSelect()` ([#11902](https://github.com/typeorm/typeorm/pull/11902) by [@Cprakhar](https://github.com/Cprakhar))
- **`.update()` query generation fixed** — corrected incorrect SQL generation when using QueryBuilder `.update()` ([#11993](https://github.com/typeorm/typeorm/pull/11993) by [@gioboa](https://github.com/gioboa))
- **Upsert SQL generation with table alias** — fixed incorrect column references in upsert queries with table inheritance and custom schemas ([#11915](https://github.com/typeorm/typeorm/pull/11915) by [@Cprakhar](https://github.com/Cprakhar))
- **Limit with joins** — fixed incorrect results when using `skip`/`take` pagination with joins ([#11987](https://github.com/typeorm/typeorm/pull/11987) by [@gioboa](https://github.com/gioboa))
- **Join attributes inside brackets** — fixed join parsing when conditions contain brackets ([#11218](https://github.com/typeorm/typeorm/pull/11218) by [@balkrushna](https://github.com/balkrushna))
- **Disable global `ORDER BY` for aggregate functions** — `repo.max()`, `repo.min()`, etc. no longer produce invalid SQL with an `ORDER BY` clause ([#11925](https://github.com/typeorm/typeorm/pull/11925) by [@Cprakhar](https://github.com/Cprakhar))
- **Pagination subquery includes joined entity PKs** — `leftJoin` with `skip`/`take` now correctly loads related entities ([#11669](https://github.com/typeorm/typeorm/pull/11669) by [@mag123c](https://github.com/mag123c))
- **Alias shortening with camelCase** — the `shorten` method now correctly handles `camelCase_aliases` ([#11283](https://github.com/typeorm/typeorm/pull/11283) by [@OSA413](https://github.com/OSA413))

### Relations & Eager loading

- **Self-referencing relation alias collision** — self-referencing relations with `relationLoadStrategy: "query"` no longer produce incorrect SQL due to alias collision ([#11066](https://github.com/typeorm/typeorm/pull/11066) by [@campmarc](https://github.com/campmarc))
- **Eager relations no longer joined twice** — explicitly specifying an eager relation in `relations` no longer causes duplicate JOINs ([#11991](https://github.com/typeorm/typeorm/pull/11991) by [@veeceey](https://github.com/veeceey))
- **Save with eagerly loaded relations** — fixed save failures when an entity has eagerly loaded relations ([#11975](https://github.com/typeorm/typeorm/pull/11975) by [@gioboa](https://github.com/gioboa))
- **Columns with `select: false` no longer returned** — columns marked with `select: false` are now correctly excluded from query results ([#11944](https://github.com/typeorm/typeorm/pull/11944) by [@gioboa](https://github.com/gioboa))
- **Subquery with `joinMapOne` methods** — fixed incorrect behavior when using join map methods ([#11943](https://github.com/typeorm/typeorm/pull/11943) by [@gioboa](https://github.com/gioboa))
- **Relation IDs in nested embedded entities** — fixed `TypeError: Cannot set properties of undefined` when mapping relation IDs within embedded entities ([#11942](https://github.com/typeorm/typeorm/pull/11942) by [@Cprakhar](https://github.com/Cprakhar))
- **`RelationIdLoader` alias handling** — uses `DriverUtils.getAlias` to prevent alias trimming by databases with short identifier limits ([#11228](https://github.com/typeorm/typeorm/pull/11228) by [@te1](https://github.com/te1))
- **`*-to-many` in `createPropertyPath`** — removed incorrect error handling that prevented certain relation configurations ([#11119](https://github.com/typeorm/typeorm/pull/11119) by [@ThbltLmr](https://github.com/ThbltLmr))

### Persistence

- **Upsert with `update: false` or `generatedType`** — upsert now correctly handles columns that should not be updated ([#12030](https://github.com/typeorm/typeorm/pull/12030) by [@gioboa](https://github.com/gioboa))
- **Value transformers applied to `FindOperator`s** — `ApplyValueTransformers` now correctly transforms values inside `FindOperator` instances like `In`, `Between`, etc. ([#11172](https://github.com/typeorm/typeorm/pull/11172) by [@ZimGil](https://github.com/ZimGil))
- **Soft deletion no longer updates already soft-deleted rows** — `softDelete` and `softRemove` now skip rows that are already soft-deleted ([#10705](https://github.com/typeorm/typeorm/pull/10705) by [@hassanmehdi98](https://github.com/hassanmehdi98))
- **Entity merge respects `null` values** — merging into an entity no longer silently drops `null` property values ([#11154](https://github.com/typeorm/typeorm/pull/11154) by [@knoid](https://github.com/knoid))
- **Map/object comparison** — fixed incorrect change detection for Map and plain object column values ([#10990](https://github.com/typeorm/typeorm/pull/10990) by [@mgohin](https://github.com/mgohin))
- **Date transformer change detection** — fixed false-positive dirty detection with date value transformers ([#11963](https://github.com/typeorm/typeorm/pull/11963) by [@gioboa](https://github.com/gioboa))
- **Child mpath update** — tree entity mpath is now correctly updated when re-parenting, even with soft-deleted parents ([#10844](https://github.com/typeorm/typeorm/pull/10844) by [@JoseCToscano](https://github.com/JoseCToscano))
- **Virtual property handling in schema builder** — schema builder no longer attempts to create columns for virtual properties ([#11000](https://github.com/typeorm/typeorm/pull/11000) by [@skyran1278](https://github.com/skyran1278))
- **Nameless `TableForeignKey` drop** — dropping a foreign key without an explicit name no longer fails ([#10744](https://github.com/typeorm/typeorm/pull/10744) by [@taichunmin](https://github.com/taichunmin))
- **`getPendingMigrations` no longer creates the migrations table** — checking for pending migrations no longer has side effects ([#11672](https://github.com/typeorm/typeorm/pull/11672) by [@pkuczynski](https://github.com/pkuczynski))

### Driver-specific fixes

- **PostgreSQL: `timestamptz` persistence/hydration** — `timestamp with time zone` columns now persist and hydrate correctly ([#11774](https://github.com/typeorm/typeorm/pull/11774) by [@Minishlink](https://github.com/Minishlink))
- **PostgreSQL: geometric type re-save** — point/circle values are now normalized on persist to avoid invalid input errors when re-saving hydrated objects ([#11857](https://github.com/typeorm/typeorm/pull/11857) by [@Cprakhar](https://github.com/Cprakhar))
- **PostgreSQL/CockroachDB: tables with quoted names** — fixed handling of tables with special characters in names ([#10993](https://github.com/typeorm/typeorm/pull/10993) by [@iskalyakin](https://github.com/iskalyakin))
- **PostgreSQL: sequential query execution** — queries are now executed sequentially on the same connection to avoid `pg` 8.19.0 deprecation warnings ([#12105](https://github.com/typeorm/typeorm/pull/12105) by [@pkuczynski](https://github.com/pkuczynski))
- **MySQL: PolarDB-X 2.0 version detection** — `getVersion()` no longer returns `undefined` for PolarDB-X 2.0 ([#11837](https://github.com/typeorm/typeorm/pull/11837) by [@Missna](https://github.com/Missna))
- **MongoDB: `ObjectIdColumn` property name translation** — `findOneBy({ id: value })` now correctly translates to `_id` in MongoDB queries ([#12200](https://github.com/typeorm/typeorm/pull/12200) by [@pkuczynski](https://github.com/pkuczynski))
- **MongoDB: embedded arrays of nested documents** — correctly processes embedded arrays within nested document structures ([#10940](https://github.com/typeorm/typeorm/pull/10940) by [@mciuchitu](https://github.com/mciuchitu))
- **SQLite: simple-enum arrays** — `simple-enum` columns with `array: true` no longer fail with CHECK constraint errors ([#11865](https://github.com/typeorm/typeorm/pull/11865) by [@Cprakhar](https://github.com/Cprakhar))
- **SAP HANA: `Date` parameter escaping** — JS `Date` values are now passed as query parameters instead of being embedded in SQL strings ([#11867](https://github.com/typeorm/typeorm/pull/11867) by [@alumni](https://github.com/alumni))
- **CockroachDB: structured query results in txn retry** — the `useStructuredResult` flag is now preserved during CockroachDB transaction retry replay ([#11861](https://github.com/typeorm/typeorm/pull/11861) by [@naorpeled](https://github.com/naorpeled))
- **Cordova: query rows affected** — query results now include the count of affected rows ([#10873](https://github.com/typeorm/typeorm/pull/10873) by [@jacobg](https://github.com/jacobg))

### Other

- **CLI `init` command** — no longer crashes when `package.json` does not exist ([#11947](https://github.com/typeorm/typeorm/pull/11947) by [@gioboa](https://github.com/gioboa))
- **Deno `process` import** — fixed incorrect import for the `process` dependency on Deno ([#11248](https://github.com/typeorm/typeorm/pull/11248) by [@yohannpoli](https://github.com/yohannpoli))

## Security fixes

- **SQL injection prevention** — parameterized queries and escaped identifiers are now used across all drivers for schema introspection and DDL methods, preventing SQL injection via database/schema/table/column names ([#12207](https://github.com/typeorm/typeorm/pull/12207) by [@pkuczynski](https://github.com/pkuczynski), [#12197](https://github.com/typeorm/typeorm/pull/12197) by [@pkuczynski](https://github.com/pkuczynski), [#12185](https://github.com/typeorm/typeorm/pull/12185) by [@pkuczynski](https://github.com/pkuczynski))

## Performance improvements

- **PostgreSQL / CockroachDB: batched DROP in `clearDatabase()`** — consolidates individual DROP statements into single batched queries, significantly reducing round-trips during test setup ([#12164](https://github.com/typeorm/typeorm/pull/12164), [#12159](https://github.com/typeorm/typeorm/pull/12159) by [@pkuczynski](https://github.com/pkuczynski))

<!-- Built against e2284d81ef198948245ba77a614a9d45536f13d4 -->
