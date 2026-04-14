# Transactions

## Creating and using transactions

Transactions are created using `DataSource` or `EntityManager`.
Examples:

```typescript
await myDataSource.transaction(async (transactionalEntityManager) => {
    // execute queries using transactionalEntityManager
})
```

or

```typescript
await myDataSource.manager.transaction(async (transactionalEntityManager) => {
    // execute queries using transactionalEntityManager
})
```

Everything you want to run in a transaction must be executed in a callback:

```typescript
await myDataSource.manager.transaction(async (transactionalEntityManager) => {
    await transactionalEntityManager.save(users)
    await transactionalEntityManager.save(photos)
    // ...
})
```

The most important restriction when working in a transaction is to **ALWAYS** use the provided instance of entity manager -
`transactionalEntityManager` in this example. DO NOT USE GLOBAL ENTITY MANAGER.
All operations **MUST** be executed using the provided transactional entity manager.

### Specifying isolation level

Specifying the isolation level for the transaction can be done by supplying it as the first parameter:

```typescript
await myDataSource.manager.transaction(
    "SERIALIZABLE",
    (transactionalEntityManager) => {},
)
```

Isolation level implementations are _not_ agnostic across all databases. Each driver declares which levels it supports, and TypeORM will throw an error if you request an unsupported level.

| Driver            | Supported isolation levels                                                          |
| ----------------- | ----------------------------------------------------------------------------------- |
| Aurora PostgreSQL | `READ UNCOMMITTED`, `READ COMMITTED`, `REPEATABLE READ`, `SERIALIZABLE`             |
| CockroachDB       | `READ UNCOMMITTED`, `READ COMMITTED`\*\*, `REPEATABLE READ`\*\*, `SERIALIZABLE`     |
| MySQL / MariaDB   | `READ UNCOMMITTED`, `READ COMMITTED`, `REPEATABLE READ`, `SERIALIZABLE`             |
| Oracle            | `READ COMMITTED`, `SERIALIZABLE`                                                    |
| PostgreSQL        | `READ UNCOMMITTED`, `READ COMMITTED`, `REPEATABLE READ`, `SERIALIZABLE`             |
| SAP HANA          | `READ COMMITTED`, `REPEATABLE READ`, `SERIALIZABLE`                                 |
| Spanner           | `READ UNCOMMITTED`, `READ COMMITTED`, `REPEATABLE READ`, `SERIALIZABLE`             |
| SQL Server        | `READ UNCOMMITTED`, `READ COMMITTED`, `REPEATABLE READ`, `SERIALIZABLE`, `SNAPSHOT` |
| SQLite            | `READ UNCOMMITTED`\*, `SERIALIZABLE`                                                |

\* SQLite's `READ UNCOMMITTED` only takes effect when [shared-cache mode](https://www.sqlite.org/sharedcache.html) is enabled. In the default mode, SQLite always uses `SERIALIZABLE` isolation regardless of the setting.

\*\* CockroachDB defaults to `SERIALIZABLE`. `READ COMMITTED` requires the cluster setting `sql.txn.read_committed_isolation.enabled` (enabled by default in recent versions). `READ UNCOMMITTED` is upgraded to `READ COMMITTED`, and `REPEATABLE READ` is upgraded to `SERIALIZABLE`. See [CockroachDB Read Committed](https://www.cockroachlabs.com/docs/stable/read-committed) for details.

### Why Aurora MySQL is missing from the table

Aurora MySQL the database engine [fully supports](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/AuroraMySQL.Reference.IsolationLevels.html) the standard set of isolation levels. The reason TypeORM cannot expose them on the `aurora-mysql` driver is the transport: this driver talks to the cluster through the [RDS Data API](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/data-api.html) (a stateless HTTP endpoint), not through a persistent MySQL protocol connection. The Data API does not provide any way to attach an isolation level to a transaction:

- [`BeginTransaction`](https://docs.aws.amazon.com/rdsdataservice/latest/APIReference/API_BeginTransaction.html) accepts only `resourceArn`, `secretArn`, `database`, and `schema` — there is no isolation parameter.
- The Data API is stateless and pools backend connections opaquely. A `SET TRANSACTION ISOLATION LEVEL ...` sent as a separate `ExecuteStatement` before `BeginTransaction` has no guaranteed affinity to the backend session that the transaction will run on, so the setting is silently dropped.
- [Multi-statement SQL is not supported](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/data-api.troubleshooting.html), so `SET TRANSACTION ...; START TRANSACTION;` cannot be sent as a single call either.
- MySQL rejects `SET TRANSACTION ISOLATION LEVEL` inside an already-started transaction with [error 1568](https://dev.mysql.com/doc/refman/8.0/en/set-transaction.html), so the approach used for Aurora PostgreSQL (issuing `SET` as the first statement _inside_ the started transaction, using the same `transactionId`) is not available on MySQL.

Because of these constraints, requesting any isolation level on an `aurora-mysql` data source will throw a validation error rather than silently using the cluster default.

If you need per-transaction isolation levels against an Aurora MySQL cluster, use the standard `mysql` driver type pointed at the cluster endpoint instead of `aurora-mysql`. That path uses a regular MySQL protocol connection (via `mysql2`) and supports the full set of isolation levels.

## Default isolation level

You can configure a default isolation level for all transactions by setting `isolationLevel` in the DataSource options:

```typescript
const dataSource = new DataSource({
    type: "postgres",
    isolationLevel: "SERIALIZABLE",
    // ...
})
```

When set, all transactions started without an explicit isolation level will use this default. An explicit isolation level passed to `transaction()` or `startTransaction()` will override the default.

> **Note:** SQL Server also supports driver-specific `options.isolationLevel` and `options.connectionIsolationLevel` settings, but these are subject to an [upstream pool limitation](./drivers/microsoft-sqlserver.md#connection-pool-does-not-reset-isolation-level). The top-level `isolationLevel` option above is not affected by this limitation because it is applied explicitly on each transaction.

## Using `QueryRunner` to create and control state of single database connection

`QueryRunner` provides a single database connection.
Transactions are organized using query runners.
Single transactions can only be established on a single query runner.
You can manually create a query runner instance and use it to manually control transaction state.
Example:

```typescript
// create a new query runner
const queryRunner = dataSource.createQueryRunner()

// establish real database connection using our new query runner
await queryRunner.connect()

// now we can execute any queries on a query runner, for example:
await queryRunner.query("SELECT * FROM users")

// we can also access entity manager that works with connection created by a query runner:
const users = await queryRunner.manager.find(User)

// lets now open a new transaction:
await queryRunner.startTransaction()

try {
    // execute some operations on this transaction:
    await queryRunner.manager.save(user1)
    await queryRunner.manager.save(user2)
    await queryRunner.manager.save(photos)

    // commit transaction now:
    await queryRunner.commitTransaction()
} catch (err) {
    // since we have errors let's rollback changes we made
    await queryRunner.rollbackTransaction()
} finally {
    // you need to release query runner which is manually created:
    await queryRunner.release()
}
```

There are 3 methods to control transactions in `QueryRunner`:

- `startTransaction` - starts a new transaction inside the query runner instance.
- `commitTransaction` - commits all changes made using the query runner instance.
- `rollbackTransaction` - rolls all changes made using the query runner instance back.

Learn more about [Query Runner](./query-runner.md).
