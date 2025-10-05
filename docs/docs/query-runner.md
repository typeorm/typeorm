# Query Runner

## What is a QueryRunner?

Each new `QueryRunner` instance takes a single connection from connection pool, if RDBMS supports connection pooling.
For databases not supporting connection pools, it uses the same connection across the entire data source.

## Creating a new `QueryRunner` instance

Use `createQueryRunner` method to create a new `QueryRunner`:

```typescript
const queryRunner = dataSource.createQueryRunner()
```

## Using `QueryRunner`

After you create a new instance of `QueryRunner` use `connect` method to actually get a connection from the connection pool:

```typescript
const queryRunner = dataSource.createQueryRunner()
await queryRunner.connect()
```

**Important**: make sure to release it when it is not necessary anymore to make it available to the connection pool again:

```typescript
await queryRunner.release()
```

After connection is released, it is not possible to use the query runner methods.

`QueryRunner` has a bunch of methods you can use, it also has its own `EntityManager` instance,
which you can use through `manager` property to run `EntityManager` methods on a particular database connection
used by `QueryRunner` instance:

```typescript
const queryRunner = dataSource.createQueryRunner()

// take a connection from the connection pool
await queryRunner.connect()

// use this particular connection to execute queries
const users = await queryRunner.manager.find(User)

// remember to release connection after you are done using it
await queryRunner.release()
```

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
	affected?: number
}
```
