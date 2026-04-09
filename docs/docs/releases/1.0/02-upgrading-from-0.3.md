---
sidebar_label: Upgrading from 0.3
---

# Upgrading from 0.3 to 1.0

This is the upgrading guide from version `0.3.x` to `1.0`.

## Automated upgrade

The `@typeorm/codemod` package can automate most of the breaking changes described in this guide:

```bash
npx @typeorm/codemod v1 src/
```

This will update your code in place — use `--dry` to preview changes without writing. The codemod handles import renames, API replacements, find option syntax, dependency upgrades, and more. Changes that cannot be automated are left as `TODO` comments for manual review.

See the [codemod README](https://github.com/typeorm/typeorm/tree/master/packages/codemod) for full usage and options.

## Platform requirements

### Node.js 20+

The minimum JavaScript target is now `ES2023`, which requires **Node.js 20 or later**. If you are using an older Node.js version, upgrade before updating TypeORM.

### `Buffer` replaced with `Uint8Array` on non-Node platforms

The browser `Buffer` polyfill has been removed. On non-Node platforms (browser, Deno, Bun), binary data is now represented as `Uint8Array`. Node.js users are not affected — Node's `Buffer` extends `Uint8Array` and continues to work as before.

## Driver changes

### MySQL / MariaDB

#### `connectorPackage` option removed

The `connectorPackage` option was removed, together with the support for the old `mysql` client. The only database client supported is now `mysql2`, which TypeORM will try to load by default. If you were using `mysql` in your project, simply replace it with `mysql2`.

#### `legacySpatialSupport` default changed to `false`

The `legacySpatialSupport` option now defaults to `false`, meaning TypeORM uses the standard-compliant `ST_GeomFromText` and `ST_AsText` spatial functions introduced in MySQL 5.7 and required by MySQL 8.0+. The legacy `GeomFromText` and `AsText` functions were removed in MySQL 8.0.

If you are running MySQL 5.6 or earlier and rely on spatial types, set `legacySpatialSupport: true` explicitly:

```typescript
new DataSource({
    type: "mysql",
    legacySpatialSupport: true,
    // ...
})
```

#### `width` and `zerofill` column options removed

MySQL 8.0.17 deprecated display width for integer types and the `ZEROFILL` attribute, and MySQL 8.4 removed them entirely. TypeORM no longer supports the `width` and `zerofill` column options. If you were using these options, remove them from your column definitions:

```typescript
// Before
@Column({ type: "int", width: 9, zerofill: true })
postCode: number

// After
@Column({ type: "int" })
postCode: number
```

If you need zero-padded display formatting, handle it in your application layer using `String.prototype.padStart()` or the MySQL `LPAD()` function in a raw query. The `unsigned` option for integer types is **not** affected by this change.

### SQLite

The `sqlite3` package has been dropped. Use `better-sqlite3` instead:

```typescript
// Before
new DataSource({
    type: "sqlite",
    database: "db.sqlite",
})

// After
new DataSource({
    type: "better-sqlite3",
    database: "db.sqlite",
})
```

#### `flags` option removed

The `sqlite3` package accepted C-level open flags (`OPEN_URI`, `OPEN_SHAREDCACHE`, etc.). `better-sqlite3` does not support this — use the dedicated options instead:

- `readonly` for read-only mode
- `enableWAL` for WAL journal mode

#### `busyTimeout` option renamed to `timeout`

The `sqlite3` package used `busyTimeout` to configure SQLite's busy timeout. `better-sqlite3` uses `timeout` instead (default: 5000ms):

```typescript
// Before
new DataSource({
    type: "sqlite",
    database: "db.sqlite",
    busyTimeout: 2000,
})

// After
new DataSource({
    type: "better-sqlite3",
    database: "db.sqlite",
    timeout: 2000,
})
```

### MongoDB

TypeORM now requires the **`mongodb` Node.js driver v7 or later** (`^7.0.0`). Support for the `mongodb` driver v5/v6 has been dropped.

#### Deprecated connection options removed

The following MongoDB connection options have been removed:

| Removed option          | Action                                               |
| ----------------------- | ---------------------------------------------------- |
| `appname`               | Use `appName` (camelCase) instead                    |
| `fsync`                 | Use `writeConcern: { journal: true }` instead        |
| `j`                     | Use `writeConcern: { journal: true }` instead        |
| `keepAlive`             | Remove — always enabled since MongoDB Driver v6.0    |
| `keepAliveInitialDelay` | Remove — not configurable since MongoDB Driver v6.0  |
| `ssl`                   | Use `tls` instead                                    |
| `sslCA`                 | Use `tlsCAFile` instead                              |
| `sslCRL`                | Remove — no replacement in modern driver             |
| `sslCert`               | Use `tlsCertificateKeyFile` instead                  |
| `sslKey`                | Use `tlsCertificateKeyFile` instead                  |
| `sslPass`               | Use `tlsCertificateKeyFilePassword` instead          |
| `sslValidate`           | Use `tlsAllowInvalidCertificates` (inverted) instead |
| `useNewUrlParser`       | Remove — no-op since MongoDB Driver v4.0             |
| `useUnifiedTopology`    | Remove — no-op since MongoDB Driver v4.0             |
| `w`                     | Use `writeConcern: { w: 1 }` instead                 |
| `wtimeout`              | Use `writeConcern: { wtimeoutMS: 2500 }` instead     |
| `wtimeoutMS`            | Use `writeConcern: { wtimeoutMS: 2500 }` instead     |

#### `stats()` method removed

The `stats()` method has been removed from `MongoQueryRunner`, `MongoEntityManager`, and `MongoRepository`. The underlying `collStats` command was deprecated in MongoDB server 6.2 and the `Collection.stats()` method was removed in MongoDB Driver v7.

Use the [`$collStats`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/collStats/) aggregation stage instead. Note that the response shape is different — properties like `count`, `size`, and `storageSize` are nested under `storageStats` rather than at the top level.

```typescript
// Before
const stats = await mongoRepository.stats()
console.log(stats.count)
console.log(stats.size)
console.log(stats.totalIndexSize)

// After — use $collStats aggregation stage
const [stats] = await dataSource.mongoManager
    .aggregate(MyEntity, [{ $collStats: { storageStats: {} } }])
    .toArray()
console.log(stats.storageStats.count)
console.log(stats.storageStats.size)
console.log(stats.storageStats.totalIndexSize)
```

#### `getMongoRepository` and `getMongoManager` globals removed

The deprecated global functions `getMongoRepository()` and `getMongoManager()` have been removed. Use the corresponding instance methods on `DataSource` or `EntityManager` instead:

```typescript
// Before
import { getMongoManager, getMongoRepository } from "typeorm"

const manager = getMongoManager()
const repository = getMongoRepository(User)

// After
const manager = dataSource.mongoManager
const repository = dataSource.getMongoRepository(User)
```

#### Types

The internal MongoDB types (`ObjectId`, etc.) are no longer re-exported from `typeorm`. Import them directly from `mongodb`:

```typescript
// Before
import { ObjectId } from "typeorm"

// After
import { ObjectId } from "mongodb"
```

### MS SQL Server

#### `domain` connection option removed

The deprecated `domain` option on `SqlServerConnectionCredentialsOptions` has been removed. Use the `authentication` option with NTLM type instead:

```typescript
// Before
new DataSource({
    type: "mssql",
    domain: "MYDOMAIN",
    username: "user",
    password: "pass",
    // ...
})

// After
new DataSource({
    type: "mssql",
    authentication: {
        type: "ntlm",
        options: {
            domain: "MYDOMAIN",
            userName: "user",
            password: "pass",
        },
    },
    // ...
})
```

#### `options.isolation` and `options.connectionIsolationLevel`

The `options.isolation` option on `SqlServerDataSourceOptions` was renamed to `options.isolationLevel` as was not the correct option in the first place. Also note that the value format has changed from `READ_COMMITTED` to `READ COMMITTED` (underscore replaced with space) to match the expected format used by the TypeORM throughout the codebase. Update your DataSource options accordingly:

```typescript
// Before
new DataSource({
    type: "mssql",
    options: {
        isolation: "READ_COMMITTED",
        connectionIsolationLevel: "READ_COMMITTED",
        // ...
    },
    // ...
})

// After
new DataSource({
    type: "mssql",
    options: {
        isolationLevel: "READ COMMITTED",
        connectionIsolationLevel: "READ COMMITTED",
        // ...
    },
    // ...
})
```

### SAP HANA

Several deprecated SAP HANA connection aliases were removed.

- `hanaClientDriver` was removed. Use `driver`.
- `pool.max` was removed. Use `pool.maxConnectedOrPooled`.
- `pool.requestTimeout` was removed. Use `pool.maxWaitTimeoutIfPoolExhausted`.
- `pool.idleTimeout` was removed. Use `pool.maxPooledIdleTime` (seconds).
- `pool.min`, `pool.maxWaitingRequests`, and `pool.checkInterval` were removed with no replacement.

Also note the default behavior changes in pool configuration:

- `pool.maxPooledIdleTime` now defaults to `30` seconds and no longer falls back to `pool.idleTimeout`.
- `pool.maxWaitTimeoutIfPoolExhausted` now defaults to `0` and no longer falls back to `pool.requestTimeout`.

### Expo

Support for the legacy Expo SQLite driver has been removed. The legacy API was removed by Expo in SDK v52. Upgrade to **Expo SDK v52 or later** and use the modern async SQLite API:

```typescript
// Before
new DataSource({
    type: "expo",
    database: "db.sqlite",
})

// After — use Expo SDK v52+ with the modern async API
new DataSource({
    type: "expo",
    database: "db.sqlite",
    driver: require("expo-sqlite"),
})
```

### Redis (cache)

Removed support for legacy (v3) Redis clients in `RedisQueryResultCache`. Upgrade to **Redis client v4 or later** (`redis`, `ioredis`):

```typescript
// Before — redis v3
import { createClient } from "redis"
const client = createClient()

// After — redis v4+
import { createClient } from "redis"
const client = createClient()
await client.connect()
```

## Data Source

### `Connection` → `DataSource`

`DataSource` replaced `Connection` in v0.3. The backward-compatible alias has now been removed:

```typescript
// Before
import { Connection, ConnectionOptions } from "typeorm"

const connection = await createConnection(options)
await connection.close()

// After
import { DataSource, DataSourceOptions } from "typeorm"

const dataSource = new DataSource(options)
await dataSource.initialize()
await dataSource.destroy()
```

The following renames apply throughout:

| Before                           | After                      |
| -------------------------------- | -------------------------- |
| `Connection`                     | `DataSource`               |
| `ConnectionOptions`              | `DataSourceOptions`        |
| `BaseConnectionOptions`          | `BaseDataSourceOptions`    |
| `MysqlConnectionOptions`         | `MysqlDataSourceOptions`   |
| _(same pattern for all drivers)_ |                            |
| `connection.connect()`           | `dataSource.initialize()`  |
| `connection.close()`             | `dataSource.destroy()`     |
| `connection.isConnected`         | `dataSource.isInitialized` |

### `name` property removed

The deprecated `name` property on `DataSource` and `BaseDataSourceOptions` has been removed. Named connections were deprecated in v0.3 when `ConnectionManager` was removed. If you were using `name` to identify connections, manage your `DataSource` instances directly instead.

Note: code that reads `dataSource.name` will now receive `undefined` instead of `"default"`. If you use this value in logging or multi-tenancy logic, update accordingly.

### `.connection` property in various classes is now `.dataSource`

The `connection` property in the `Driver`, `QueryRunner`, `EntityManager`, `QueryBuilder`, `EntityMetadata` and `*Event` classes was renamed to `dataSource`. For `EntityManager`, this change was announced in 0.3, but it was not actually implemented. To ease the transition, a deprecated getter was added that returns the same value as `dataSource`.

### Miscellaneous

The `ConnectionManager` class has been removed. If you were using it to manage multiple connections, create and manage your `DataSource` instances directly instead.

`ConnectionOptionsReader` has also been simplified: `all()` was renamed to `get()` (returning all configs as an array), and the old `get(name)` and `has(name)` methods were removed.

```typescript
const reader = new ConnectionOptionsReader()

// when your ormconfig has a single data source
const [options] = await reader.get()

// when you need a specific config from multiple data sources
const allOptions = await reader.get()
const postgresOptions = allOptions.find((o) => o.type === "postgres")
```

### Global convenience functions removed

The following deprecated global functions have been removed:

- `createConnection` / `createConnections`
- `getConnection`
- `getConnectionManager`
- `getConnectionOptions`
- `getManager`
- `getSqljsManager`
- `getRepository`
- `getTreeRepository`
- `createQueryBuilder`

Use the equivalent methods on your `DataSource` instance:

```typescript
// Before
const repo = getRepository(User)
const qb = createQueryBuilder("user")

// After
const repo = dataSource.getRepository(User)
const qb = dataSource.createQueryBuilder("user")
```

### Configuration via environment variables removed

The deprecated `ConnectionOptionsEnvReader` class and the ability to configure connections via `TYPEORM_CONNECTION`, `TYPEORM_URL`, and other `TYPEORM_*` environment variables has been removed. The `ormconfig.env` file format is also no longer supported. TypeORM no longer auto-loads `.env` files or depends on `dotenv`.

Use a TypeScript or JavaScript configuration file instead:

```typescript
// ormconfig.ts
export default {
    type: process.env.DB_TYPE,
    url: process.env.DB_URL,
    // ...
}
```

## Behavioral changes

### `invalidWhereValuesBehavior` default changed to `throw`

**This is a significant behavioral change that may break existing applications at runtime.**

The default behavior for null and undefined values in where conditions has changed. Previously, null and undefined values were silently ignored (the property was skipped). Now, both **throw an error by default**.

This change prevents subtle bugs where queries like `findBy({ id: undefined })` would silently return all rows instead of failing.

```typescript
// v0.3: silently returns all posts (null is ignored)
// v1.0: throws TypeORMError
await repository.find({ where: { text: null } })

// v0.3: silently returns all posts (undefined is ignored)
// v1.0: throws TypeORMError
await repository.find({ where: { text: undefined } })
```

To match null values, use the `IsNull()` operator:

```typescript
import { IsNull } from "typeorm"

await repository.find({ where: { text: IsNull() } })
```

To restore the previous behavior, set `invalidWhereValuesBehavior` in your data source options:

```typescript
new DataSource({
    // ...
    invalidWhereValuesBehavior: {
        null: "ignore",
        undefined: "ignore",
    },
})
```

This setting guards all high-level APIs — find operations, repository/manager mutation methods, and `queryBuilder.setFindOptions()` (the only QueryBuilder method that is affected). The rest of the QueryBuilder methods (`.where()`, `.andWhere()`, `.orWhere()`) are **not** affected — null and undefined values pass through as-is. See [Null and undefined handling](../../data-source/5-null-and-undefined-handling.md) for full details.

### Hashing

The internal hashing implementation has been replaced with Node.js built-in `crypto`. If you use TypeORM's query result cache, existing cached entries will be invalidated after upgrading because the hash function produces different output. Caches will be rebuilt automatically — you may see a brief increase in cache misses.

### Glob patterns

Glob patterns (used in entity/migration file discovery) are now handled by `tinyglobby` instead of `glob`. This is a drop-in replacement for most projects.

### `orphanedRowAction: "nullify"` with non-nullable foreign keys

When `orphanedRowAction` is `"nullify"` (the default) and the foreign key column is non-nullable, orphaned children are now **deleted** instead of throwing a database constraint violation. Previously, TypeORM would attempt to set the FK to `null`, which failed on non-nullable columns.

This only applies when the relation is loaded on the entity instance. TypeORM does not automatically load relations — it only traverses relation values that are already populated on the object. To ensure orphaned children are handled, load the relation before calling `remove` or `save`:

```typescript
const parent = await manager.findOne(Parent, {
    where: { id: 1 },
    relations: { children: true },
})
await manager.remove(parent)
```

If the relation is not loaded (i.e. the property is `undefined`), TypeORM will not detect or delete orphaned children, which may result in foreign key constraint violations.

If you were relying on the error to prevent accidental child deletion, set `orphanedRowAction: "disable"` on the relation to preserve the old behavior.

### Cascade remove now works for one-to-many relations

Calling `manager.remove(entity)` with `cascade: true` or `cascade: ["remove"]` on a one-to-many relation now correctly deletes child entities before the parent. Previously, the child entities were not cascade-removed, causing the DELETE to fail with a foreign key constraint violation. Additionally, cascade operations are now scoped to the matching operation type — for example, `save()` only follows `insert`/`update` cascades and no longer traverses `remove`-only relations.

### Many-to-many junction rows and soft-deleted entities

Calling `recover()` on a soft-deleted entity with many-to-many relations no longer throws a duplicate key violation. Junction table rows are not touched by `softRemove`, but TypeORM previously couldn't see them when loading the entity for recovery, causing it to attempt duplicate inserts.

As a side effect, many-to-many junction comparisons during `save()` now include soft-deleted related entities. If you explicitly set a relation array that excludes a soft-deleted entity, its junction row will be removed:

```typescript
// photo2 was independently soft-deleted but its junction row exists
user.manyToManyPhotos = [photo1] // photo2 excluded
await manager.save(user) // junction row for photo2 is now removed
```

This only applies when the relation property is explicitly set. If it is `undefined`, no comparison is performed and junction rows are left intact.

## Columns

### `readonly` option removed

The deprecated `readonly` column option has been removed. Use the `update` option instead — note that it takes the **opposite** value:

```typescript
// Before
@Column({ readonly: true })
authorName: string

// After
@Column({ update: false })
authorName: string
```

### `unsigned` on `ColumnNumericOptions` removed

The deprecated `unsigned` property on `ColumnNumericOptions` (used with decimal/float column type overloads like `@Column("decimal", { unsigned: true })`) has been removed, as MySQL deprecated `UNSIGNED` for non-integer numeric types. The `unsigned` option on `ColumnOptions` for integer types is **not** affected.

## Relations

### `nullable: false` now uses INNER JOIN

Relations marked with `nullable: false` now use `INNER JOIN` instead of `LEFT JOIN` when loaded via `relations`, eager loading, or find options. This applies only to relation types that own the join column (`ManyToOne` and owning-side `OneToOne`).

This is semantically correct since a non-nullable foreign key guarantees the related entity exists, and allows the database optimizer to produce more efficient query plans.

**Potentially breaking:** If your database contains rows that violate the `NOT NULL` constraint (e.g. orphaned foreign keys, or `nullable: false` was set but the column is actually nullable in the DB), those rows will be excluded from query results. Verify your data integrity or change the relation to `nullable: true` if needed.

```typescript
// INNER JOIN — related entity is guaranteed to exist
@ManyToOne(() => User, { nullable: false })
author: User

// LEFT JOIN — related entity may not exist (default)
@ManyToOne(() => User)
optionalEditor: User
```

`OneToMany`, `ManyToMany`, and inverse `OneToOne` relations always use `LEFT JOIN` regardless of the `nullable` setting, since these relation types do not have a join column on the current table.

**Soft-delete exception:** If the related entity has a `@DeleteDateColumn`, `LEFT JOIN` is used even for `nullable: false` relations (unless `withDeleted: true` is set). This prevents soft-deleted related entities from filtering out their parent rows.

## Repository

### `findOneById`

The deprecated `findOneById` method has been removed from `EntityManager`, `Repository`, `BaseEntity`, `MongoEntityManager`, and `MongoRepository`. Use `findOneBy` instead:

```typescript
// Before
const user = await manager.findOneById(User, 1)
const user = await repository.findOneById(1)
const user = await User.findOneById(1)

// After
const user = await manager.findOneBy(User, { id: 1 })
const user = await repository.findOneBy({ id: 1 })
const user = await User.findOneBy({ id: 1 })
```

For MongoDB entities with `@ObjectIdColumn()`, `findOneBy` works the same way — TypeORM automatically translates the property name to `_id`.

### `findByIds` removed

The deprecated `findByIds` method has been removed from `EntityManager`, `Repository`, and `BaseEntity`. Use `findBy` with the `In` operator instead:

```typescript
// Before
const users = await repository.findByIds([1, 2, 3])

// After
import { In } from "typeorm"

const users = await repository.findBy({ id: In([1, 2, 3]) })
```

### `exist` renamed to `exists`

The deprecated `Repository.exist()` method has been removed. Use `exists()` instead — the behavior is identical:

```typescript
// Before
const hasUsers = await userRepository.exist({ where: { isActive: true } })

// After
const hasUsers = await userRepository.exists({ where: { isActive: true } })
```

### `AbstractRepository`, `@EntityRepository`, and `getCustomRepository` removed

The `AbstractRepository` class, `@EntityRepository` decorator, and `getCustomRepository()` method have been removed. These were deprecated in v0.3 in favor of `Repository.extend()`:

```typescript
// Before
@EntityRepository(User)
class UserRepository extends AbstractRepository<User> {
    findByName(name: string) {
        return this.repository.findOneBy({ name })
    }
}
const userRepo = dataSource.getCustomRepository(UserRepository)

// After
const UserRepository = dataSource.getRepository(User).extend({
    findByName(name: string) {
        return this.findOneBy({ name })
    },
})
```

The following error classes were also removed: `CustomRepositoryDoesNotHaveEntityError`, `CustomRepositoryCannotInheritRepositoryError`, `CustomRepositoryNotFoundError`.

### `@RelationCount` decorator and `loadRelationCountAndMap` removed

The `@RelationCount` decorator and `SelectQueryBuilder.loadRelationCountAndMap()` method have been removed. Use `@VirtualColumn` or a sub-query in your query builder instead:

```typescript
// Before
@RelationCount((post: Post) => post.categories)
categoryCount: number

// After — use @VirtualColumn with a sub-query
// Replace the junction table name and column names to match your schema
@VirtualColumn({
    query: (alias) =>
        `SELECT COUNT(*) FROM post_categories_category WHERE postId = ${alias}.id`,
})
categoryCount: number
```

## Find Options

### `join` option removed

The deprecated `join` property on `FindOneOptions` and `FindManyOptions` has been removed, along with the `JoinOptions` interface.

#### `leftJoinAndSelect` → `relations`

If you were using `leftJoinAndSelect`, replace it with the `relations` object syntax — `relations` always performs LEFT JOINs with selection, which is equivalent:

```typescript
// Before
const posts = await repository.find({
    join: {
        alias: "post",
        leftJoinAndSelect: {
            categories: "post.categories",
            author: "post.author",
        },
    },
})

// After
const posts = await repository.find({
    relations: { categories: true, author: true },
})
```

#### All other join types → QueryBuilder

The `relations` option only supports LEFT JOINs with selection. If you were using `innerJoinAndSelect`, `innerJoin`, or `leftJoin` (without select), switch to the QueryBuilder API:

```typescript
// Before — innerJoinAndSelect
const posts = await repository.find({
    join: {
        alias: "post",
        innerJoinAndSelect: {
            categories: "post.categories",
        },
    },
})

// After — QueryBuilder with innerJoinAndSelect
const posts = await repository
    .createQueryBuilder("post")
    .innerJoinAndSelect("post.categories", "categories")
    .getMany()

// Before — leftJoin (without select)
const posts = await repository.find({
    join: {
        alias: "post",
        leftJoin: {
            categories: "post.categories",
        },
    },
    where: { categories: { isRemoved: false } },
})

// After — QueryBuilder with leftJoin
const posts = await repository
    .createQueryBuilder("post")
    .leftJoin("post.categories", "categories")
    .where("categories.isRemoved = :isRemoved", { isRemoved: false })
    .getMany()
```

This distinction matters in practice. For example, PostgreSQL and CockroachDB do not allow `FOR UPDATE` on the nullable side of an outer join, so queries that combine locking with joined relations may need INNER JOINs:

```typescript
// Before — innerJoinAndSelect + lock
const post = await repository.findOne({
    join: {
        alias: "post",
        innerJoinAndSelect: {
            categories: "post.categories",
        },
    },
    lock: { mode: "pessimistic_write", tables: ["category"] },
})

// After — QueryBuilder with innerJoinAndSelect + lock
const post = await repository
    .createQueryBuilder("post")
    .innerJoinAndSelect("post.categories", "categories")
    .setLock("pessimistic_write", undefined, ["categories"])
    .getOne()
```

#### Locking with nested relations → QueryBuilder

The `relations` option cannot be used with pessimistic locking on joined tables because `relations` always uses LEFT JOINs, and PostgreSQL/CockroachDB reject `FOR UPDATE` on the nullable side of outer joins. Use QueryBuilder with `innerJoinAndSelect` instead:

```typescript
// Before — nested relations + lock via find options
const post = await repository.findOne({
    where: { id: 1 },
    join: {
        alias: "post",
        innerJoinAndSelect: {
            categories: "post.categories",
            images: "categories.images",
        },
    },
    lock: { mode: "pessimistic_write", tables: ["images"] },
})

// After — QueryBuilder with innerJoinAndSelect + lock
const post = await repository
    .createQueryBuilder("post")
    .innerJoinAndSelect("post.categories", "categories")
    .innerJoinAndSelect("categories.images", "images")
    .where("post.id = :id", { id: 1 })
    .setLock("pessimistic_write", undefined, ["images"])
    .getOne()
```

Note that locking the _main_ table still works with `relations` — only locking _joined_ tables requires QueryBuilder with inner joins.

### String-based `select` removed

The deprecated string-array syntax for `select` find options has been removed. Use the object syntax instead:

```typescript
// Before
const users = await repository.find({
    select: ["id", "name"],
})

// After
const users = await repository.find({
    select: { id: true, name: true },
})
```

The removed type is `FindOptionsSelectByString`.

### String-based `relations` removed

The deprecated string-array syntax for `relations` find options has been removed. Use the object syntax instead:

```typescript
// Before
const users = await repository.find({
    relations: ["profile", "posts"],
})

// After
const users = await repository.find({
    relations: { profile: true, posts: true },
})
```

The removed type is `FindOptionsRelationByString`.

## QueryBuilder

### Semicolons rejected in raw SQL expression methods

The `select()`, `addSelect()`, `groupBy()`, `addGroupBy()`, `orderBy()`, and `addOrderBy()` methods on all query builders (`SelectQueryBuilder`, `UpdateQueryBuilder`, `SoftDeleteQueryBuilder`, and base `QueryBuilder`) now reject inputs containing semicolons at runtime to prevent SQL statement stacking attacks. The `orderBy()` methods also validate that order direction values are `"ASC"` or `"DESC"` and nulls values are `"NULLS FIRST"` or `"NULLS LAST"`. If you have legitimate SQL expressions that contain semicolons (e.g., inside string literals), use parameter binding instead:

```typescript
// This now throws
qb.select("col; DROP TABLE post")

// Use parameter binding for values
qb.where("post.title = :title", { title: "value;with;semicolons" })
```

### `printSql` removed

The `printSql()` method on query builders has been removed. It was redundant because all executed queries are already automatically logged through the configured logger when query logging is enabled. Use `getSql()` or `getQueryAndParameters()` to inspect the generated SQL instead:

```typescript
// Before
const users = await dataSource
    .getRepository(User)
    .createQueryBuilder("user")
    .where("user.id = :id", { id: 1 })
    .printSql()
    .getMany()

// After — inspect SQL before executing
const qb = dataSource
    .getRepository(User)
    .createQueryBuilder("user")
    .where("user.id = :id", { id: 1 })

console.log(qb.getSql())
// or: const [sql, params] = qb.getQueryAndParameters()

const users = await qb.getMany()
```

To log all executed queries automatically, enable query logging in your DataSource:

```typescript
new DataSource({
    // ...
    logging: ["query"],
})
```

### `onConflict` removed

The `onConflict()` method on `InsertQueryBuilder` has been removed. It accepted raw SQL strings which were driver-specific and error-prone. Use `orIgnore()` or `orUpdate()` instead:

```typescript
// Before
await dataSource
    .createQueryBuilder()
    .insert()
    .into(Post)
    .values(post)
    .onConflict(`("id") DO NOTHING`)
    .execute()

// After
await dataSource
    .createQueryBuilder()
    .insert()
    .into(Post)
    .values(post)
    .orIgnore()
    .execute()

// Before
await dataSource
    .createQueryBuilder()
    .insert()
    .into(Post)
    .values(post)
    .onConflict(`("id") DO UPDATE SET "title" = :title`)
    .setParameter("title", post.title)
    .execute()

// After
await dataSource
    .createQueryBuilder()
    .insert()
    .into(Post)
    .values(post)
    .orUpdate(["title"], ["id"])
    .execute()
```

### `orUpdate` object overload removed

The object-based `orUpdate()` overload accepting `{ columns?, overwrite?, conflict_target? }` has been removed. Use the array-based signature instead:

```typescript
// Before
.orUpdate({ conflict_target: ["date"], overwrite: ["title"] })

// After
.orUpdate(["title"], ["date"])
```

### `setNativeParameters` removed

```typescript
// Before
qb.setNativeParameters({ key: "value" })

// After
qb.setParameters({ key: "value" })
```

### `WhereExpression` type alias removed

```typescript
// Before
import { WhereExpression } from "typeorm"

// After
import { WhereExpressionBuilder } from "typeorm"
```

### `replacePropertyNames` removed

The deprecated `replacePropertyNames()` protected method on QueryBuilder has been removed. If you were overriding it in a custom subclass, the override is no longer called.

### Deprecated lock modes removed

```typescript
// Before
.setLock("pessimistic_partial_write")

// After
.setLock("pessimistic_write")
.setOnLocked("skip_locked")

// Before
.setLock("pessimistic_write_or_fail")

// After
.setLock("pessimistic_write")
.setOnLocked("nowait")
```

The same applies to find options:

```typescript
// Before
{ lock: { mode: "pessimistic_partial_write" } }

// After
{ lock: { mode: "pessimistic_write", onLocked: "skip_locked" } }

// Before
{ lock: { mode: "pessimistic_write_or_fail" } }

// After
{ lock: { mode: "pessimistic_write", onLocked: "nowait" } }
```

## Migrations

### `getAllMigrations` removed

The deprecated `getAllMigrations()` method has been removed from `MigrationExecutor`. Use `getPendingMigrations()` or `getExecutedMigrations()` instead, or access `dataSource.migrations` directly for the list of registered migration classes:

```typescript
// Before
const migrations = await migrationExecutor.getAllMigrations()

// After — depending on what you need
const pending = await migrationExecutor.getPendingMigrations()
const executed = await migrationExecutor.getExecutedMigrations()
const registered = dataSource.migrations
```

### `QueryRunner.loadedTables` and `loadedViews` removed

```typescript
// Before
const tables = queryRunner.loadedTables
const views = queryRunner.loadedViews

// After
const tables = await queryRunner.getTables()
const views = await queryRunner.getViews()
```

Note: the replacements are async methods, not synchronous properties.

## Container system

The deprecated IoC container integration has been removed: `useContainer()`, `getFromContainer()`, `ContainerInterface`, `ContainedType`, and `UseContainerOptions`.

TypeORM no longer has built-in IoC container support. The `typeorm-typedi-extensions` and `typeorm-routing-controllers-extensions` packages are also no longer compatible. The sections below cover how to migrate depending on your setup.

### Subscribers and migrations with dependencies

TypeORM always instantiates subscribers and migrations internally using a zero-argument constructor, so you cannot pass pre-built instances. If your migrations need access to services, use the `DataSource` (available via `queryRunner.dataSource`) inside the migration itself:

```typescript
// Before
import { useContainer } from "typeorm"
import { Container } from "typedi"
useContainer(Container)

// After — access dependencies via the DataSource inside the migration
export class MyMigration1234 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const repo = queryRunner.dataSource.getRepository(User)
        // ...
    }
}
```

### Accessing repositories and entity manager

If you previously used `typeorm-typedi-extensions` to inject `EntityManager` or repositories into your services, use the `DataSource` directly instead:

```typescript
// Before (with typeorm-typedi-extensions)
import { InjectManager, InjectRepository } from "typeorm-typedi-extensions"

class UserService {
    @InjectManager()
    private manager: EntityManager

    @InjectRepository(User)
    private userRepository: Repository<User>
}

// After — access from the DataSource instance
class UserService {
    private manager: EntityManager
    private userRepository: Repository<User>

    constructor(dataSource: DataSource) {
        this.manager = dataSource.manager
        this.userRepository = dataSource.getRepository(User)
    }
}
```

### Using with a DI framework

If you use a DI framework, register the `DataSource` (or its repositories) as providers in your container:

```typescript
// typedi example
import { DataSource } from "typeorm"
import { Container } from "typedi"

const dataSource = new DataSource({
    /* ... */
})
await dataSource.initialize()
Container.set(DataSource, dataSource)
Container.set("UserRepository", dataSource.getRepository(User))
```

### NestJS

NestJS users are not affected — the `@nestjs/typeorm` package has its own integration that does not depend on TypeORM's removed container system. However, `@nestjs/typeorm` v10 and the current v11.0.0 attempt to register the removed `Connection` class and will crash at startup. Make sure you are using a version of `@nestjs/typeorm` that includes the fix for TypeORM v1 compatibility.

## Other internal removals

The following internal APIs have been removed. These only affect you if you were building custom drivers, extending QueryBuilder, or using low-level metadata APIs:

| Removed                                        | Replacement                                       |
| ---------------------------------------------- | ------------------------------------------------- |
| `Broadcaster.broadcastLoadEventsForAll()`      | No replacement — use individual event subscribers |
| `DriverUtils.buildColumnAlias()`               | Use `DriverUtils.buildAlias()`                    |
| `EntityMetadata.createPropertyPath()` (static) | Removed with no public replacement                |
| `QueryExpressionMap.nativeParameters`          | Use `QueryExpressionMap.parameters`               |
| `RdbmsSchemaBuilder.renameTables()`            | Removed                                           |
