# SQL Tag

TypeORM provides a convenient way to write SQL queries using template literals with automatic parameter handling based on your database type. This feature helps prevent SQL injection while making your queries more readable. Behind the scenes, the SQL tag is implemented as a wrapper around the `.query` method, providing a more developer-friendly interface while maintaining the same underlying functionality.

## Basic Usage

The SQL tag is available on your DataSource instance:

```typescript
const users = await dataSource.sql`SELECT * FROM users WHERE name = ${"John"}`
```

## Parameter Handling

Parameters are automatically escaped and formatted according to your database type:

- **PostgreSQL, CockroachDB, Aurora PostgreSQL, MariaDB**: Uses `$1`, `$2`, etc.
```typescript
// Query becomes: SELECT * FROM users WHERE name = $1
const users = await dataSource.sql`SELECT * FROM users WHERE name = ${"John"}`
```

- **MySQL, SQLite, Aurora MySQL**: Uses `?`
```typescript
// Query becomes: SELECT * FROM users WHERE name = ?
const users = await dataSource.sql`SELECT * FROM users WHERE name = ${"John"}`
```

- **Oracle**: Uses `:1`, `:2`, etc.
```typescript
// Query becomes: SELECT * FROM users WHERE name = :1
const users = await dataSource.sql`SELECT * FROM users WHERE name = ${"John"}`
```

- **MSSQL**: Uses `@1`, `@2`, etc.
```typescript
// Query becomes: SELECT * FROM users WHERE name = @1
const users = await dataSource.sql`SELECT * FROM users WHERE name = ${"John"}`
```

### Multiple Parameters

You can use multiple parameters and complex expressions:

```typescript
const name = "John"
const age = 30
const active = true
const users = await dataSource.sql`
    SELECT * FROM users
    WHERE name LIKE ${name + "%"}
    AND age > ${age}
    AND is_active = ${active}
`
```

## Benefits

- **SQL Injection Prevention**: All parameters are properly escaped.
- **Database Agnostic**: Parameter formatting is handled automatically based on your database type.
- **Readable Queries**: Template literals make queries more readable than traditional parameter arrays.

## Comparison with Query Method

While the traditional `query` method requires you to handle parameter placeholders manually:

```typescript
// Traditional query method
await dataSource.query(
    "SELECT * FROM users WHERE name = $1 AND age > $2",
    ["John", 30]
)

// SQL tag is more intuitive
await dataSource.sql`SELECT * FROM users WHERE name = ${"John"} AND age > ${30}`
```

The SQL tag handles this automatically, making your code more maintainable and less error-prone.
