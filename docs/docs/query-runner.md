# Query Runner

## What is a QueryRunner?

Each new `QueryRunner` instance takes a single connection from the connection pool, if the RDBMS supports connection pooling.
For databases that do not support connection pools, it uses the same connection across the entire data source.

## Creating a new `QueryRunner` instance

Use the `createQueryRunner` method to create a new `QueryRunner`:

```typescript
const queryRunner = dataSource.createQueryRunner()
```

## Using `QueryRunner`

After creating a new instance of `QueryRunner`, a connection will be acquired from the pool when you issue the first query:

```typescript
const queryRunner = dataSource.createQueryRunner()
await queryRunner.query("SELECT 1")
await queryRunner.release()
```

You can also use `connect` method to directly get a connection from the connection pool:

```typescript
const queryRunner = dataSource.createQueryRunner()
const clientConnection = await queryRunner.connect()
await queryRunner.release()
```

**Important**: make sure to release the `QueryRunner` when it is no longer necessary to return the connection back to the connection pool:

```typescript
await queryRunner.release()
```

After the `QueryRunner` is released, it is no longer possible to use the query runner methods.

`QueryRunner` also has its own `EntityManager` instance, which you can use through the `manager` property to run `EntityManager` queries on a particular database connection used by the `QueryRunner` instance:

```typescript
let queryRunner: QueryRunner
try {
    queryRunner = dataSource.createQueryRunner()
    // use a single database connection to execute multiple queries
    await queryRunner.manager.update(
        Employee,
        { level: "junior" },
        { bonus: 0.2 },
    )
    await queryRunner.manager.update(
        Employee,
        { level: "senior" },
        { bonus: 0.1 },
    )
} catch (error) {
    console.error(error)
} finally {
    // remember to release connection after you are done using it
    await queryRunner.release()
}
```

## Explicit Resource Management

`QueryRunner` also supports explicit resource management:

```typescript
async function updateSalaries() {
    await using queryRunner = dataSource.createQueryRunner()
    await queryRunner.manager.update(
        Employee,
        { level: "junior" },
        { bonus: 0.2 },
    )
    await queryRunner.manager.update(
        Employee,
        { level: "senior" },
        { bonus: 0.1 },
    )
    // no need anymore to manually release the QueryRunner
}

try {
    await updateSalaries()
} catch (error) {
    console.error(error)
}
```

When declaring a query runner like this, it will be automatically released after the last statement in the containing scope was executed.
