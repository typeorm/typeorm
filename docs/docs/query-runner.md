# Query Runner

## What is a QueryRunner?

Each new `QueryRunner` instance takes a single connection from the connection pool, if the RDBMS supports connection pooling.
For databases that do not support connection pools, it uses the same connection across the entire data source.

The full QueryRunner API is documented in the [migrations section](./migrations/09-api.md).

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

## Executing raw SQL and structured results

The low-level `query` method available on `DataSource`, `EntityManager`, and `QueryRunner` returns by default the driver-specific raw result (usually an array of rows or a primitive). To get consistent metadata (affected row count, normalized record array, etc.) you can request a structured return using a `QueryOptions` object.

### `QueryOptions` interface

```ts
interface QueryOptions {
  /** When true, the call returns a QueryResult object instead of the raw driver return. */
  useStructuredResult?: boolean
}
```

### Raw vs structured examples

```ts
// Raw result (array of rows)
const rows = await dataSource.query("SELECT * FROM users WHERE id = ?", [1])

// Structured result
const result = await dataSource.query(
  "SELECT * FROM users WHERE id = ?",
  [1],
  { useStructuredResult: true }
)
console.log(result.records) // same rows
console.log(result.affected) // undefined for a SELECT
```

### With EntityManager

```ts
const update = await manager.query(
    "UPDATE user SET active = ? WHERE last_login < ?",
    [false, cutoffDate],
    { useStructuredResult: true }
)
console.log(update.affected)
```

### With a QueryRunner

```ts
const qr = dataSource.createQueryRunner()
await qr.connect()
try {
    const del = await qr.query(
        "DELETE FROM session WHERE expires_at < ?",
        [new Date()],
        { useStructuredResult: true }
    )
    console.log(del.affected)
} finally {
  await qr.release()
}
```



### Migration note (deprecated boolean overload)

Older versions allowed `query(sql, params, true)` to return a `QueryResult`. That boolean overload is deprecated. Replace:

```ts
await queryRunner.query(sql, params, true)
```

with:

```ts
await queryRunner.query(sql, params, { useStructuredResult: true })
```

### When to request structured results

Use `{ useStructuredResult: true }` when you need:

- Affected row counts for write operations.
- Cross-driver consistency of returned metadata.
- Both normalized records and the raw driver payload.

Leave it off for the lightest weight simple SELECT queries.

### `QueryResult` shape (simplified)

```ts
interface QueryResult<T = any> {
    raw: any
    records?: T[]
    recordsets?: T[][]
    affected?: number
}
```
