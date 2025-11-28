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

After you create a new instance of `QueryRunner`, use the `connect` method to get a connection from the connection pool:

```typescript
const queryRunner = dataSource.createQueryRunner()
await queryRunner.connect()
```

**Important**: Make sure to release it when it is no longer needed to make it available to the connection pool again:

```typescript
await queryRunner.release()
```

After the connection is released, you cannot use the query runner's methods.

`QueryRunner` has a bunch of methods you can use, it also has its own `EntityManager` instance,
which you can use through `manager` property to run `EntityManager` methods on a particular database connection
used by `QueryRunner` instance:

```typescript
const queryRunner = dataSource.createQueryRunner()

// take a connection from the connection pool
await queryRunner.connect()

// use this particular connection to execute queries
const users = await queryRunner.manager.find(User)

// remember to release the connection after you are done using it
await queryRunner.release()
```
