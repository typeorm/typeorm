# Handling Null and Undefined Values in Find Operations

TypeORM provides fine-grained control over how `null` and `undefined` values are handled in find operations through the `findWhereBehavior` configuration option in your data source options.

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

You can customize how null and undefined values are handled using the `findWhereBehavior` option in your connection configuration:

```typescript
const dataSource = new DataSource({
    // ... other options
    findWhereBehavior: {
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
    findWhereBehavior: {
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
    findWhereBehavior: {
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
    findWhereBehavior: {
        null: "throw",
    },
})

// This will throw an error
const posts = await repository.find({
    where: {
        text: null,
    },
})
// Error: Null value encountered in property 'text' of the find operation.
// To match with SQL NULL, the IsNull() operator must be used.
// Set 'findWhereBehavior.null' to 'ignore' or 'sql-null' in connection options to skip or handle null values.
```

### Undefined Behavior Options

The `undefined` behavior can be set to one of two values:

#### `'ignore'` (default)

JavaScript `undefined` values in where conditions are ignored and the property is skipped:

```typescript
const dataSource = new DataSource({
    // ... other options
    findWhereBehavior: {
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
    findWhereBehavior: {
        undefined: "throw",
    },
})

// This will throw an error
const posts = await repository.find({
    where: {
        text: undefined,
    },
})
// Error: Undefined value encountered in property 'text' of the find operation.
// Set 'findWhereBehavior.undefined' to 'ignore' in connection options to skip properties with undefined values.
```

Note that this only applies to explicitly set `undefined` values, not omitted properties.

## Using Both Options Together

You can configure both behaviors independently for comprehensive control:

```typescript
const dataSource = new DataSource({
    // ... other options
    findWhereBehavior: {
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

## TypeScript Considerations

TypeScript will not allow you to pass `null` values in where conditions, we believe that this is the recommended behavior

(Note this is only relevant when [strictNullChecks](https://www.typescriptlang.org/tsconfig/#strictNullChecks) is enabled in your tsconfig file, otherwise TypeScript ignores all `null` values.)
