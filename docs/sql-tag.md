# SQL Tag

TypeORM provides a way to write SQL queries using template literals with automatic parameter handling based on your database type. This feature helps prevent SQL injection while making queries more readable. The SQL tag is implemented as a wrapper around the `.query` method, providing an alternative interface while maintaining the same underlying functionality.

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

## Features

- **SQL Injection Prevention**: Parameters are properly escaped
- **Database Agnostic**: Parameter formatting is handled based on your database type
- **Readable Queries**: Template literals can make queries more readable than parameter arrays

## Comparison with Query Method

The traditional `query` method requires manual parameter placeholder handling:

```typescript
// Traditional query method
await dataSource.query(
    "SELECT * FROM users WHERE name = $1 AND age > $2",
    ["John", 30]
)

// SQL tag alternative
await dataSource.sql`SELECT * FROM users WHERE name = ${"John"} AND age > ${30}`
```

The SQL tag handles parameter formatting automatically, which can reduce potential errors.
