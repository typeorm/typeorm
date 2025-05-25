# Handling Null and Undefined Values in Find Operations

TypeORM provides fine-grained control over how `null` and `undefined` values are handled in find operations through the `findWhereBehavior` configuration option in your data source options.

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

The correct way to match null values in where conditions is to use the `IsNull` operator (for details see [Find Options](find-options.md)):

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
-   Maintain the convenience of partial where conditions

## TypeScript Configuration

By default, TypeScript will not allow `null` or `undefined` values in where conditions, encouraging type safety. However, if you've configured `findWhereBehavior` to handle these values at runtime, you can opt into more permissive TypeScript checking using declaration merging.

### Enabling Nullable Where Types

To allow `null` and `undefined` values in TypeScript, use declaration merging to extend the `TypeORMSettings` interface. This should be done in a separate declaration file (e.g., `types/typeorm.d.ts`) or at the beginning of your application:

```typescript
// types/typeorm.d.ts or at the top of your main file
declare module "typeorm" {
    interface TypeORMSettings {
        allowNullableWhere: true
    }
}

// Your runtime configuration
const dataSource = new DataSource({
    findWhereBehavior: {
        null: "sql-null",
        undefined: "throw",
    },
})
```

With this configuration, TypeScript will allow null and undefined values in where conditions:

```typescript
// These are now allowed by TypeScript
const posts = await repository.find({
    where: {
        text: null, // ✅ Transformed to SQL NULL
        category: undefined, // ✅ Will throw at runtime as configured
    },
})

// Complex queries also work
const result = await repository.findOne({
    where: {
        title: "My Post",
        text: null,
        publishedAt: undefined,
    },
})
```

### Important Notes

-   Only enable `allowNullableWhere` when you've properly configured `findWhereBehavior`
-   The TypeScript declaration should reflect your actual runtime configuration
-   This setting affects all find operations in your application
-   Consider the trade-offs between type safety and convenience for your team
