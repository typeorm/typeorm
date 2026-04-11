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

### Specifying Isolation Levels

Specifying the isolation level for the transaction can be done by supplying it as the first parameter:

```typescript
await myDataSource.manager.transaction(
    "SERIALIZABLE",
    (transactionalEntityManager) => {},
)
```

Isolation level implementations are _not_ agnostic across all databases. Each driver declares which levels it supports, and TypeORM will throw an error if you request an unsupported level.

| Driver          | Supported isolation levels                                                          |
| --------------- | ----------------------------------------------------------------------------------- |
| MySQL / MariaDB | `READ UNCOMMITTED`, `READ COMMITTED`, `REPEATABLE READ`, `SERIALIZABLE`             |
| PostgreSQL      | `READ UNCOMMITTED`, `READ COMMITTED`, `REPEATABLE READ`, `SERIALIZABLE`             |
| CockroachDB     | `READ UNCOMMITTED`, `READ COMMITTED`, `REPEATABLE READ`, `SERIALIZABLE`             |
| SQL Server      | `READ UNCOMMITTED`, `READ COMMITTED`, `REPEATABLE READ`, `SERIALIZABLE`, `SNAPSHOT` |
| Oracle          | `READ COMMITTED`, `SERIALIZABLE`                                                    |
| SAP HANA        | `READ COMMITTED`, `REPEATABLE READ`, `SERIALIZABLE`                                 |
| SQLite          | `READ UNCOMMITTED`\*, `SERIALIZABLE`                                                |
| Spanner         | `READ UNCOMMITTED`, `READ COMMITTED`, `REPEATABLE READ`, `SERIALIZABLE`             |

\* SQLite's `READ UNCOMMITTED` only takes effect when [shared-cache mode](https://www.sqlite.org/sharedcache.html) is enabled. In the default mode, SQLite always uses `SERIALIZABLE` isolation regardless of the setting.

SQL Server also supports setting a default isolation level via data source options (`isolationLevel` and `connectionIsolationLevel`), but these are subject to an [upstream pool limitation](./drivers/microsoft-sqlserver.md#connection-pool-does-not-reset-isolation-level). Per-transaction isolation levels are not affected.

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
