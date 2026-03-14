# Migration to v1

This is the migration guide for upgrading from version `0.3.x` to `1.0`.

## JavaScript and Node.js versions

The lowest JavaScript version supported is now `ES2023`, which means Node 20 and later is supported. If you are using a platform that does not support `ES2023`, please upgrade.

## Client libraries

TypeORM requires newer versions of the database client libraries.

## MySQL / MariaDB

### `connectorPackage`

The `connectorPackage` option was removed, together with the support for the old `mysql` client. The only database client supported is now `mysql2`, which TypeORM will try to load by default. If you were using `mysql` in your project, simply replace it with `mysql2`.

### `legacySpatialSupport` default changed to `false`

The `legacySpatialSupport` option now defaults to `false`, meaning TypeORM uses the standard-compliant `ST_GeomFromText` and `ST_AsText` spatial functions introduced in MySQL 5.7 and required by MySQL 8.0+. The legacy `GeomFromText` and `AsText` functions were removed in MySQL 8.0.

If you are running MySQL 5.6 or earlier and rely on spatial types, set `legacySpatialSupport: true` explicitly:

```typescript
new DataSource({
    type: "mysql",
    legacySpatialSupport: true,
    // ...
})
```

### `width` and `zerofill` column options removed

MySQL 8.0.17 deprecated display width for integer types and the `ZEROFILL` attribute, and MySQL 8.4 removed them entirely. TypeORM no longer supports the `width` and `zerofill` column options. If you were using these options, remove them from your column definitions:

```typescript
// Before
@Column({ type: "int", width: 9, zerofill: true })
postCode: number

// After
@Column({ type: "int" })
postCode: number
```

If you need zero-padded display formatting, handle it in your application layer using `String.prototype.padStart()` or the MySQL `LPAD()` function in a raw query. The `unsigned` option for integer types is **not** affected by this change and continues to work as before.

## SAP HANA

Several deprecated SAP HANA connection aliases were removed.

- `hanaClientDriver` was removed. Use `driver`.
- `pool.max` was removed. Use `pool.maxConnectedOrPooled`.
- `pool.requestTimeout` was removed. Use `pool.maxWaitTimeoutIfPoolExhausted`.
- `pool.idleTimeout` was removed. Use `pool.maxPooledIdleTime` (seconds).
- `pool.min`, `pool.maxWaitingRequests`, and `pool.checkInterval` were removed with no replacement.

Also note the default behavior changes in pool configuration:

- `pool.maxPooledIdleTime` now defaults to `30` seconds and no longer falls back to `pool.idleTimeout`.
- `pool.maxWaitTimeoutIfPoolExhausted` now defaults to `0` and no longer falls back to `pool.requestTimeout`.

## SQLite

Drop support to `sqlite3` in favour of `better-sqlite3` as the primary driver for `sqlite` databases:

```typescript
new DataSource({
    type: "better-sqlite3", // was "sqlite"
    database: "db.sqlite",
})
```

### `flags` option removed

The `sqlite3` package accepted C-level open flags (`OPEN_URI`, `OPEN_SHAREDCACHE`, etc.). `better-sqlite3` does not support this — use the dedicated options instead:

- `readonly` for read-only mode
- `enableWAL` for WAL journal mode

### `busyTimeout` option renamed to `timeout`

The `sqlite3` package used `busyTimeout` to configure SQLite's busy timeout. `better-sqlite3` uses `timeout` instead (default: 5000ms). Update your DataSource options accordingly:

```typescript
new DataSource({
    type: "better-sqlite3",
    database: "db.sqlite",
    timeout: 2000, // was `busyTimeout` in sqlite3
})
```

## MongoDB

TypeORM now requires **MongoDB server 6.0 or later** and the **`mongodb` Node.js driver v6 or later** (`^6.0.0 || ^7.0.0`). Support for MongoDB server 5.x and the `mongodb` driver v5 has been dropped.

### Deprecated connection options removed

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

### `getMongoRepository` and `getMongoManager` globals

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

### Types

The internal MongoDB types are no longer exported. You can import `ObjectId` from `mongodb` instead of `typeorm`.

## MS SQL Server

### `domain` connection option removed

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

## Expo

Support for the legacy Expo SQLite driver has been removed. The legacy API was removed by Expo in SDK v52, so you'll need to use Expo SDK v52 or later with the modern async SQLite API.

## Hashing

Historically TypeORM used a non-standard SHA-1 implementation for hashing. This has been changed to use the built-in `crypto` module from Node.js.

For browser environments `RandomGenerator.sha1` was fixed to the standard implementation.

## Glob patterns

Glob patterns are now handled by `tinyglobby` instead of `glob`. While `tinyglobby` is almost a drop-in replacement for `glob`, there might be certain cases in which the behavior is different.

## Removed deprecations

### Redis

Removed support for legacy (v3/v4) Redis clients in `RedisQueryResultCache`.

### Global convenience functions

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

Use the equivalent methods on your `DataSource` instance instead. For example:

```typescript
// Before
const repo = getRepository(User)
const qb = createQueryBuilder("user")

// After
const repo = dataSource.getRepository(User)
const qb = dataSource.createQueryBuilder("user")
```

## Data Source

### `Connection` vs `DataSource`

`DataSource` replaced `Connection` in v0.3 to provide a better meaning to the abstract concept represented by this class. For backwards compatibility, `Connection` was kept as an alias to `DataSource`, now this alias was removed. Similarly, `ConnectionOptions` is now `DataSourceOptions`.

In addition, the old method names of the `DataSource` class have been removed, so `Connection.connect()` is now only `DataSource.initialize()`, `Connection.close()` is `DataSource.destroy()` etc.

### `ConnectionManager`

The `ConnectionManager` class has been removed. If you were using it to manage multiple connections, create and manage your `DataSource` instances directly instead.

## Columns

### `readonly`

The deprecated `readonly` column option has been removed. Use the `update` option instead — note that it takes the **opposite** value:

```typescript
// Before
@Column({ readonly: true })
authorName: string

// After
@Column({ update: false })
authorName: string
```

### `unsigned`

The deprecated `unsigned` property on `ColumnNumericOptions` (used with decimal/float column type overloads like `@Column("decimal", { unsigned: true })`) has been removed, as MySQL deprecated `UNSIGNED` for non-integer numeric types. The `unsigned` option on `ColumnOptions` for integer types is **not** affected and continues to work.

## Repository

### `findByIds`

The deprecated `findByIds` method has been removed from `EntityManager`, `Repository`, and `BaseEntity`. Use `findBy` with the `In` operator instead:

```typescript
// Before
const users = await repository.findByIds([1, 2, 3])

// After
import { In } from "typeorm"

const users = await repository.findBy({ id: In([1, 2, 3]) })
```

### `exist`

The deprecated `Repository.exist()` method has been removed. Use `exists()` instead — the behavior is identical:

```typescript
// Before
const hasUsers = await userRepository.exist({ where: { isActive: true } })

// After
const hasUsers = await userRepository.exists({ where: { isActive: true } })
```

### `AbstractRepository`, `@EntityRepository`, and `getCustomRepository`

The `AbstractRepository` class, `@EntityRepository` decorator, and `getCustomRepository()` method have been removed. These were deprecated in v0.3 in favor of `Repository.extend()`.

Before:

```typescript
@EntityRepository(User)
class UserRepository extends AbstractRepository<User> {
    findByName(name: string) {
        return this.repository.findOneBy({ name })
    }
}

// Usage
const userRepo = dataSource.getCustomRepository(UserRepository)
```

After:

```typescript
const UserRepository = dataSource.getRepository(User).extend({
    findByName(name: string) {
        return this.findOneBy({ name })
    },
})
```

The following error classes were also removed: `CustomRepositoryDoesNotHaveEntityError`, `CustomRepositoryCannotInheritRepositoryError`, `CustomRepositoryNotFoundError`.

### `@RelationCount` decorator and `loadRelationCountAndMap`

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

The deprecated `join` property on `FindOneOptions` and `FindManyOptions` has been removed, along with the `JoinOptions` interface. Use `relations` with the object syntax instead:

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

For more complex join scenarios (e.g., `leftJoin` without select, or `innerJoin`), use the QueryBuilder API directly.

### String-based `select` and `relations` removed

The deprecated string-array syntax for `select` and `relations` find options has been removed. Use the object syntax instead:

```typescript
// Before
const users = await repository.find({
    select: ["id", "name"],
    relations: ["profile", "posts"],
})

// After
const users = await repository.find({
    select: { id: true, name: true },
    relations: { profile: true, posts: true },
})
```

The removed types are `FindOptionsSelectByString` and `FindOptionsRelationByString`.

## QueryBuilder

### `printSql` renamed to `logQuery`

The `printSql()` method on query builders has been renamed to `logQuery()` to better reflect its behavior — it logs the query through the configured logger rather than printing to stdout:

```typescript
// Before
const users = await dataSource
    .getRepository(User)
    .createQueryBuilder("user")
    .where("user.id = :id", { id: 1 })
    .printSql()
    .getMany()

// After
const users = await dataSource
    .getRepository(User)
    .createQueryBuilder("user")
    .where("user.id = :id", { id: 1 })
    .logQuery()
    .getMany()
```

### `onConflict`

The `onConflict()` method on `InsertQueryBuilder` has been removed. Use `orIgnore()` or `orUpdate()` instead:

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

### `orUpdate`

The object-based `orUpdate()` overload accepting `{ columns?, overwrite?, conflict_target? }` has been removed. Use the array-based signature instead:

```typescript
// Before
.orUpdate({ conflict_target: ["date"], overwrite: ["title"] })

// After
.orUpdate(["title"], ["date"])
```

### `replacePropertyNames`

The deprecated `replacePropertyNames()` protected method has been removed. It was a no-op since property name replacement was moved to end-of-query processing via `replacePropertyNamesForTheWholeQuery()`. If you were overriding this method in a custom QueryBuilder subclass, the override is no longer called.

### `setNativeParameters`

The `setNativeParameters()` method has been removed. Use `setParameters()` instead.

### `WhereExpression` type alias

The deprecated `WhereExpression` type alias has been removed. Use `WhereExpressionBuilder` instead.

### Deprecated lock modes

The `pessimistic_partial_write` and `pessimistic_write_or_fail` lock modes have been removed. Use `pessimistic_write` with the `onLocked` option instead:

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

### `getAllMigrations`

The deprecated `getAllMigrations()` method has been removed. Use `getMigrations()` instead — the behavior is identical:

```typescript
// Before
const migrations = await migrationExecutor.getAllMigrations()

// After
const migrations = migrationExecutor.getMigrations()
```

### `QueryRunner.loadedTables` and `loadedViews`

The deprecated `loadedTables` and `loadedViews` properties have been removed from the `QueryRunner` interface. Use `getTables()` and `getViews()` instead:

```typescript
// Before
const tables = queryRunner.loadedTables
const views = queryRunner.loadedViews

// After
const tables = await queryRunner.getTables()
const views = await queryRunner.getViews()
```

## Configuration

### `invalidWhereValuesBehavior` default changed to `throw`

The default behavior for null and undefined values in where conditions has changed. Previously, null and undefined values were silently ignored (the property was skipped). Now, both **throw an error by default**.

This change prevents subtle bugs where queries like `findBy({ id: undefined })` would silently return the first row instead of failing.

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

This setting guards all high-level APIs — find operations, repository/manager mutation methods, and `queryBuilder.setFindOptions()` (the only QueryBuilder method that is affected). The rest of the QueryBuilder methods (`.where()`, `.andWhere()`, `.orWhere()`) are **not** affected — null and undefined values pass through as-is. See [Null and undefined handling](../data-source/5-null-and-undefined-handling.md) for full details.

### Drop support for configuration via environment variables

The deprecated `ConnectionOptionsEnvReader` class and the ability to configure connections via `TYPEORM_CONNECTION`, `TYPEORM_URL`, and other `TYPEORM_*` environment variables has been removed. The `ormconfig.env` file format is also no longer supported. TypeORM no longer auto-loads `.env` files or depends on `dotenv`.

Use a TypeScript or JavaScript configuration file (`ormconfig.ts`, `ormconfig.js`) instead, referencing environment variables directly:

```typescript
// ormconfig.ts
export default {
    type: process.env.DB_TYPE,
    url: process.env.DB_URL,
    // ...
}
```

### `name`

The deprecated `name` property on `DataSource` and `BaseDataSourceOptions` has been removed. Named connections were deprecated in v0.3 when `ConnectionManager` was removed. If you were using `name` to identify connections, manage your `DataSource` instances directly instead.

`ConnectionOptionsReader` has also been simplified: `all()` was renamed to `get()` (returning all configs as an array), and the old `get(name)` and `has(name)` methods were removed.

```typescript
const reader = new ConnectionOptionsReader()

// when your ormconfig has a single data source
const [options] = await reader.get()

// when you need a specific config from multiple data sources
const allOptions = await reader.get()
const postgresOptions = allOptions.find((o) => o.type === "postgres")
```

## Container system

The deprecated IoC container integration has been removed: `useContainer()`, `getFromContainer()`, `ContainerInterface`, `ContainedType`, and `UseContainerOptions`.

TypeORM no longer has built-in IoC container support. The `typeorm-typedi-extensions` and `typeorm-routing-controllers-extensions` packages are also no longer compatible. The sections below cover how to migrate depending on your setup.

### Subscribers and migrations with dependencies

TypeORM always instantiates subscribers and migrations internally using a zero-argument constructor, so you cannot pass pre-built instances. If your migrations need access to services, use the `DataSource` (available via `queryRunner.connection`) inside the migration itself:

```typescript
// Before
import { useContainer } from "typeorm"
import { Container } from "typedi"
useContainer(Container)

// After — access dependencies via the DataSource inside the migration
export class MyMigration1234 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const repo = queryRunner.connection.getRepository(User)
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

NestJS users are not affected — the `@nestjs/typeorm` package has its own integration that does not depend on TypeORM's removed container system. No changes are needed.
