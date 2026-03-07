# Handling null and undefined values in where conditions

In 'WHERE' conditions the values `null` and `undefined` are not strictly valid values in TypeORM.

Passing a known `null` value is disallowed by TypeScript (when you've enabled `strictNullChecks` in tsconfig.json) at compile time. The default behavior is for `null` and `undefined` values encountered at runtime to throw an error.

The way in which `null` and `undefined` values are handled can be customised through the `invalidWhereValuesBehavior` configuration option in your data source options. This applies to high-level operations such as find operations, repository methods, and EntityManager methods (update, delete, softDelete, restore).

:::warning
This setting does **not** affect QueryBuilder's `.where()`, `.andWhere()`, or `.orWhere()` methods. QueryBuilder is a low-level API where null/undefined values pass through as-is. Use the `IsNull()` operator or parameterized conditions in QueryBuilder for explicit null handling.
:::

## Default Behavior

By default, TypeORM throws an error when `null` or `undefined` values are encountered in where conditions. This prevents unexpected results and helps catch potential bugs early:

```typescript
// Both queries will throw an error
const posts1 = await repository.find({
    where: {
        text: null,
    },
})
// Error: Null value encountered in property 'text' of a where condition.

const posts2 = await repository.find({
    where: {
        text: undefined,
    },
})
// Error: Undefined value encountered in property 'text' of a where condition.
```

To match null values in where conditions, use the `IsNull` operator (for details see [Find Options](../working-with-entity-manager/3-find-options.md)):

```typescript
const posts = await repository.find({
    where: {
        text: IsNull(),
    },
})
```

## Configuration

You can customize how null and undefined values are handled using the `invalidWhereValuesBehavior` option in your data source configuration:

```typescript
const dataSource = new DataSource({
    // ... other options
    invalidWhereValuesBehavior: {
        null: "ignore" | "sql-null" | "throw",
        undefined: "ignore" | "throw",
    },
})
```

### Null Behavior Options

The `null` behavior can be set to one of three values:

#### `'ignore'`

JavaScript `null` values in where conditions are ignored and the property is skipped:

```typescript
const dataSource = new DataSource({
    // ... other options
    invalidWhereValuesBehavior: {
        null: "ignore",
    },
})

// This will return all posts, ignoring the text property
const posts = await repository.find({
    where: {
        text: null,
    },
})
```

#### `'sql-null'`

JavaScript `null` values are transformed into SQL `NULL` conditions:

```typescript
const dataSource = new DataSource({
    // ... other options
    invalidWhereValuesBehavior: {
        null: "sql-null",
    },
})

// This will only return posts where the text column is NULL in the database
const posts = await repository.find({
    where: {
        text: null,
    },
})
```

#### `'throw'` (default)

JavaScript `null` values cause a TypeORMError to be thrown:

```typescript
const dataSource = new DataSource({
    // ... other options
    invalidWhereValuesBehavior: {
        null: "throw",
    },
})

// This will throw an error
const posts = await repository.find({
    where: {
        text: null,
    },
})
// Error: Null value encountered in property 'text' of a where condition.
// To match with SQL NULL, the IsNull() operator must be used.
// Set 'invalidWhereValuesBehavior.null' to 'ignore' or 'sql-null' in data source options to skip or handle null values.
```

### Undefined Behavior Options

The `undefined` behavior can be set to one of two values:

#### `'ignore'`

JavaScript `undefined` values in where conditions are ignored and the property is skipped:

```typescript
const dataSource = new DataSource({
    // ... other options
    invalidWhereValuesBehavior: {
        undefined: "ignore",
    },
})

// This will return all posts, ignoring the text property
const posts = await repository.find({
    where: {
        text: undefined,
    },
})
```

#### `'throw'` (default)

JavaScript `undefined` values cause a TypeORMError to be thrown:

```typescript
const dataSource = new DataSource({
    // ... other options
    invalidWhereValuesBehavior: {
        undefined: "throw",
    },
})

// This will throw an error
const posts = await repository.find({
    where: {
        text: undefined,
    },
})
// Error: Undefined value encountered in property 'text' of a where condition.
// Set 'invalidWhereValuesBehavior.undefined' to 'ignore' in data source options to skip properties with undefined values.
```

Note that this only applies to explicitly set `undefined` values, not omitted properties.

## Using Both Options Together

You can configure both behaviors independently for comprehensive control:

```typescript
const dataSource = new DataSource({
    // ... other options
    invalidWhereValuesBehavior: {
        null: "sql-null",
        undefined: "throw",
    },
})
```

This configuration will:

1. Transform JavaScript `null` values to SQL `NULL` in where conditions
2. Throw an error if any `undefined` values are encountered
3. Still ignore properties that are not provided in the where clause

This combination is useful when you want to:

- Be explicit about searching for NULL values in the database
- Catch potential programming errors where undefined values might slip into your queries

## Supported operations

The `invalidWhereValuesBehavior` configuration applies to high-level TypeORM operations, not QueryBuilder's direct `.where()` method:

### Find Operations

```typescript
// Repository.find() / findOne() / findBy() / findOneBy()
await repository.find({ where: { text: null } }) // Respects invalidWhereValuesBehavior

// EntityManager.find() / findOne() / findBy() / findOneBy()
await manager.find(Post, { where: { text: null } }) // Respects invalidWhereValuesBehavior
```

### Repository and EntityManager Methods

```typescript
// Repository.update()
await repository.update({ text: null }, { title: "Updated" }) // Respects invalidWhereValuesBehavior

// Repository.delete()
await repository.delete({ text: null }) // Respects invalidWhereValuesBehavior

// EntityManager.update()
await manager.update(Post, { text: null }, { title: "Updated" }) // Respects invalidWhereValuesBehavior

// EntityManager.delete()
await manager.delete(Post, { text: null }) // Respects invalidWhereValuesBehavior

// EntityManager.softDelete()
await manager.softDelete(Post, { text: null }) // Respects invalidWhereValuesBehavior
```

### QueryBuilder with setFindOptions

```typescript
// setFindOptions goes through the find-options path, so it respects the setting
await dataSource
    .createQueryBuilder(Post, "post")
    .setFindOptions({ where: { text: null } }) // Respects invalidWhereValuesBehavior
    .getMany()
```

### Not affected: QueryBuilder `.where()`

QueryBuilder's `.where()`, `.andWhere()`, and `.orWhere()` are low-level APIs and are **not** affected by this setting. Null and undefined values pass through as-is:

```typescript
// This does NOT respect invalidWhereValuesBehavior — null passes through as-is
await dataSource
    .createQueryBuilder()
    .update(Post)
    .set({ title: "Updated" })
    .where({ text: null })
    .execute()
```

## How null and undefined behave in QueryBuilder `.where()`

Since QueryBuilder is a low-level API, null and undefined values are **not** validated or transformed. Understanding their behavior is important to avoid unexpected results.

### `null` in QueryBuilder `.where()`

When `null` is passed as a value in an object-style `.where()`, it generates a SQL equality check against `NULL`:

```typescript
await dataSource
    .createQueryBuilder(Post, "post")
    .where({ text: null })
    .getMany()
// Generates: WHERE post.text = NULL
```

In SQL, `column = NULL` is **always false** — nothing equals NULL. This query will **return zero results**, which is almost certainly not what you intended. To match NULL values, use the `IsNull()` operator:

```typescript
import { IsNull } from "typeorm"

await dataSource
    .createQueryBuilder(Post, "post")
    .where({ text: IsNull() })
    .getMany()
// Generates: WHERE post.text IS NULL
```

Or use a string condition:

```typescript
await dataSource
    .createQueryBuilder(Post, "post")
    .where("post.text IS NULL")
    .getMany()
```

### `undefined` in QueryBuilder `.where()`

When `undefined` is passed as a value, the same behavior applies — it generates `WHERE column = NULL`, which is always false:

```typescript
await dataSource
    .createQueryBuilder(Post, "post")
    .where({ text: undefined })
    .getMany()
// Generates: WHERE post.text = NULL
// Returns: zero results
```

### Summary table

| Value                                 | High-level API (find/repository/manager) | QueryBuilder `.where()`           |
| ------------------------------------- | ---------------------------------------- | --------------------------------- |
| `null` with `"ignore"` (default)      | Property skipped — no filter             | `WHERE col = NULL` — zero results |
| `null` with `"sql-null"`              | `WHERE col IS NULL`                      | `WHERE col = NULL` — zero results |
| `null` with `"throw"`                 | Throws error                             | `WHERE col = NULL` — zero results |
| `undefined` with `"ignore"` (default) | Property skipped — no filter             | `WHERE col = NULL` — zero results |
| `undefined` with `"throw"`            | Throws error                             | `WHERE col = NULL` — zero results |
| `IsNull()`                            | `WHERE col IS NULL`                      | `WHERE col IS NULL`               |

:::tip
Always use `IsNull()` when you want to match SQL NULL values, regardless of which API you use. It works correctly in both high-level and QueryBuilder contexts.
:::
