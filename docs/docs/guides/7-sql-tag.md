# SQL Tag

TypeORM provides a way to write SQL queries using template literals with automatic parameter handling based on your database type. This feature helps prevent SQL injection while making queries more readable. The SQL tag is implemented as a wrapper around the `.query` method, providing an alternative interface while maintaining the same underlying functionality.

## Basic Usage

The `sql` tag is available on DataSource, EntityManager, Repository and QueryRunner instances:

```typescript
const users = await dataSource.sql`SELECT * FROM users WHERE name = ${"John"}`
```

## Parameter Handling

Parameters are automatically escaped and formatted according to your database type:

- **PostgreSQL**, **CockroachDB**, **Aurora PostgreSQL** uses `$1`, `$2`, etc.:

```typescript
// Query becomes: SELECT * FROM users WHERE name = $1
const users = await dataSource.sql`SELECT * FROM users WHERE name = ${"John"}`
```

- **MySQL**, **MariaDB**, **Aurora MySQL**, **SAP**, **SQLite** use `?`:

```typescript
// Query becomes: SELECT * FROM users WHERE name = ?
const users = await dataSource.sql`SELECT * FROM users WHERE name = ${"John"}`
```

- **Oracle** uses `:1`, `:2`, etc.:

```typescript
// Query becomes: SELECT * FROM users WHERE name = :1
const users = await dataSource.sql`SELECT * FROM users WHERE name = ${"John"}`
```

- **MSSQL** uses `@1`, `@2`, etc.:

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

### Expanding Parameter Lists

To transform an array of values into a dynamic list of parameters in a template expression, wrap the array in a function. This is commonly used to write an `IN (...)` expression in SQL, where each value in the list must be supplied as a separate parameter:

```typescript
// Query becomes: SELECT * FROM users WHERE id IN (?, ?, ?)
const users = await dataSource.sql`
    SELECT * FROM users
    WHERE id IN (${() => [1, 2, 3]})
`
```

### Interpolating Unescaped Expressions

When you want to insert a template expression which should _not_ be transformed into a database parameter, wrap the string in a function. This can be used to dynamically define column, table or schema names which can't be parameterized, or to conditionally set clauses in the SQL.

**Caution!** No escaping is performed on raw SQL inserted in this way. It is not safe to use this with values sourced from user input.

```typescript
// Query becomes: SELECT * FROM dynamic_table_name
const rawData = await dataSource.sql`
    SELECT * FROM ${() => "dynamic_table_name"}
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
await dataSource.query("SELECT * FROM users WHERE name = $1 AND age > $2", [
    "John",
    30,
])

// SQL tag alternative
await dataSource.sql`SELECT * FROM users WHERE name = ${"John"} AND age > ${30}`
```

The SQL tag handles parameter formatting automatically, which can reduce potential errors.
