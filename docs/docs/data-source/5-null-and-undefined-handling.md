# Handling null and undefined values in where conditions

In 'WHERE' conditions the values `null` and `undefined` are not strictly valid values in TypeORM.

Passing a known `null` value is disallowed by TypeScript (when you've enabled `strictNullChecks` in tsconfig.json) at compile time. But the default behavior is for `null` values encountered at runtime to be ignored. Similarly, `undefined` values are allowed by TypeScript and ignored at runtime.

The acceptance of `null` and `undefined` values can sometimes cause unexpected results and requires caution. This is especially a concern when values are passed from user input without adequate validation.

For example, calling `Repository.findOneBy({ id: undefined })` returns the first row from the table, and `Repository.findBy({ userId: null })` is unfiltered and returns all rows.

The way in which `null` and `undefined` values are handled can be customised through the `invalidWhereValuesBehavior` configuration option in your data source options. This applies to all operations that support 'WHERE' conditions, including find operations, query builders, and repository methods.

:::note
The current behavior will be changing in future versions of TypeORM,
we recommend setting both `null` and `undefined` behaviors to throw to prepare for these changes
:::

## Default Behavior

By default, TypeORM skips both `null` and `undefined` values in where conditions. This means that if you include a property with a `null` or `undefined` value in your where clause, it will be ignored:

```typescript
// Both queries will return all posts, ignoring the text property
const posts1 = await repository.find({
    where: {
        text: null,
    },
})

const posts2 = await repository.find({
    where: {
        text: undefined,
    },
})
```

The correct way to match null values in where conditions is to use the `IsNull` operator (for details see [Find Options](../working-with-entity-manager/3-find-options.md)):

```typescript
const posts = await repository.find({
    where: {
        text: IsNull(),
    },
})
```

## Configuration

You can customize how null and undefined values are handled using the `invalidWhereValuesBehavior` option in your connection configuration:

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

#### `'ignore'` (default)

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

#### `'throw'`

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
// Set 'invalidWhereValuesBehavior.null' to 'ignore' or 'sql-null' in connection options to skip or handle null values.
```

### Undefined Behavior Options

The `undefined` behavior can be set to one of two values:

#### `'ignore'` (default)

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

#### `'throw'`

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
// Set 'invalidWhereValuesBehavior.undefined' to 'ignore' in connection options to skip properties with undefined values.
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

-   Be explicit about searching for NULL values in the database
-   Catch potential programming errors where undefined values might slip into your queries

## Works with all where operations

The `invalidWhereValuesBehavior` configuration applies to **all TypeORM operations** that support where conditions, not just repository find methods:

### Query Builders

```typescript
// UpdateQueryBuilder
await dataSource
    .createQueryBuilder()
    .update(Post)
    .set({ title: "Updated" })
    .where({ text: null }) // Respects invalidWhereValuesBehavior
    .execute()

// DeleteQueryBuilder  
await dataSource
    .createQueryBuilder()
    .delete()
    .from(Post)
    .where({ text: null }) // Respects invalidWhereValuesBehavior
    .execute()

// SoftDeleteQueryBuilder
await dataSource
    .createQueryBuilder()
    .softDelete()
    .from(Post)
    .where({ text: null }) // Respects invalidWhereValuesBehavior
    .execute()
```

### Repository Methods

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

All these operations will consistently apply your configured `invalidWhereValuesBehavior` settings.
