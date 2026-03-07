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

### Deprecated connection options removed

The following MongoDB connection options have been removed:

| Removed option       | Action                                           |
| -------------------- | ------------------------------------------------ |
| `appname`            | Use `appName` (camelCase) instead                |
| `fsync`              | Use `writeConcern: { journal: true }` instead    |
| `j`                  | Use `writeConcern: { journal: true }` instead    |
| `useNewUrlParser`    | Remove — no-op since MongoDB Driver v4.0         |
| `useUnifiedTopology` | Remove — no-op since MongoDB Driver v4.0         |
| `wtimeout`           | Use `writeConcern: { wtimeoutMS: 2500 }` instead |

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

## Expo

Support for the legacy Expo SQLite driver has been removed. The legacy API was removed by Expo in SDK v52, so you'll need to use Expo SDK v52 or later with the modern async SQLite API.

## Hashing

Historically TypeORM used a non-standard SHA-1 implementation for hashing. This has been changed to use the built-in `crypto` module from Node.js.

For browser environments `RandomGenerator.sha1` was fixed to the standard implementation.

## Glob patterns

Glob patterns are now handled by `tinyglobby` instead of `glob`. While `tinyglobby` is almost a drop-in replacement for `glob`, there might be certain cases in which the behavior is different.

## Removed deprecations

### `Connection` vs `DataSource`

`DataSource` replaced `Connection` in v0.3 to provide a better meaning to the abstract concept represented by this class. For backwards compatibility, `Connection` was kept as an alias to `DataSource`, now this alias was removed. Similarly, `ConnectionOptions` is now `DataSourceOptions`.

In addition, the old method names of the `DataSource` class have been removed, so `Connection.connect()` is now only `DataSource.initialize()`, `Connection.close()` is `DataSource.destroy()` etc.

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

### `ConnectionManager`

The `ConnectionManager` class has been removed. If you were using it to manage multiple connections, create and manage your `DataSource` instances directly instead.

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

### `WhereExpression` type alias

The deprecated `WhereExpression` type alias has been removed. Use `WhereExpressionBuilder` instead.

### `Repository.exist()`

The deprecated `Repository.exist()` method has been removed. Use `exists()` instead — the behavior is identical:

```typescript
// Before
const hasUsers = await userRepository.exist({ where: { isActive: true } })

// After
const hasUsers = await userRepository.exists({ where: { isActive: true } })
```
