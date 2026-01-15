# Transactions

## Creating and using transactions

There are two ways of creating transactions, `transaction` and `transactionWithContext`. Both methods are available from `DataSource` and `EntityManager`.

`transaction` is supported on all platforms, `transactionWithContext` is only available on Node.js.

### Using cross-platform `transaction`

Cross-platform transactions are created using `DataSource.transaction` or `EntityManager.transaction`.
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

### Using Node.js-only `transactionWithContext`

Transactions using async tracking context are created using `DataSource.transactionWithContext` or `EntityManager.transactionWithContext`.

```typescript
await myDataSource.transactionWithContext(async () => {
    // Exececute queries using any repository/entity/manager, as long as they are using the same
    // DataSource they will be performed inside the same transaction.
})
```

or

```typescript
await myDataSource.manager.transactionWithContext(async () => {
    // Exececute queries using any repository/entity/manager, as long as they are using the same
    // DataSource they will be performed inside the same transaction.
})
```

The main advantage of using `transactionWithContext` over `transaction` is that you can use any pre-existing repositories, custom-repositories, or entities as long as they are all created on the same DataSource the transaction is started from.

### Specifying Isolation Levels

Specifying the isolation level for the transaction can be done by supplying it as the first parameter:

```typescript
await myDataSource.manager.transaction( // OR `.transactionWithContext`
    "SERIALIZABLE",
    (transactionalEntityManager) => {},
)
```

Isolation level implementations are _not_ agnostic across all databases.

The following database drivers support the standard isolation levels (`READ UNCOMMITTED`, `READ COMMITTED`, `REPEATABLE READ`, `SERIALIZABLE`):

-   MySQL
-   Postgres
-   SQL Server

**SQLite** defaults transactions to `SERIALIZABLE`, but if _shared cache mode_ is enabled, a transaction can use the `READ UNCOMMITTED` isolation level.

**Oracle** only supports the `READ COMMITTED` and `SERIALIZABLE` isolation levels.

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

Alternatively you can use the `runWithQueryRunner` method to create a temporary QueryRunner:

```typescript
dataSource.runWithQueryRunner(async (queryRunner: QueryRunner) => {
    // queryRunner will behave the same as manually created one
    await queryRunner.connect()
    await queryRunner.startTransaction()
    try {
        await queryRunner.query(`INSERT INTO user SELECT * FROM other`)
        const result = queryRunner.query('SELECT * FROM user')
        await queryRunner.commitTransaction()
        // return value from function is returned from runWithQueryRunner
        return result
    } catch (e) {
        await queryRunner.rollbackTransaction()
        // We can re-throw error if we want it to propagate to where runWithQueryRunner
        // was called, runWithQueryRunner handles QueryRunner cleanup
        throw e
    }
    // queryRunner will automatically be released when function ends, regardless if an exception
    // is thrown
})
```

There are 3 methods to control transactions in `QueryRunner`:

-   `startTransaction` - starts a new transaction inside the query runner instance.
-   `commitTransaction` - commits all changes made using the query runner instance.
-   `rollbackTransaction` - rolls all changes made using the query runner instance back.

Learn more about [Query Runner](../query-runner.md).
