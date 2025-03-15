# Handling Null and Undefined Values in Find Operations

TypeORM provides fine-grained control over how `null` and `undefined` values are handled in find operations through two configuration options: `treatJsNullAsSqlNull` and `throwOnUndefinedInFind`.

## Default Behavior

By default, TypeORM skips both `null` and `undefined` values in where conditions. This means that if you include a property with a `null` or `undefined` value in your where clause, it will be ignored:

```typescript
// Both queries will return all posts, ignoring the text property
const posts1 = await repository.find({
    where: {
        text: null
    }
});

const posts2 = await repository.find({
    where: {
        text: undefined
    }
});
```

## Treating JavaScript null as SQL NULL

You can change how `null` values are handled using the `treatJsNullAsSqlNull` option. When enabled, JavaScript `null` values in where conditions will be transformed into SQL `NULL` values:

```typescript
// Connection-level configuration
const dataSource = new DataSource({
    // ... other options
    treatJsNullAsSqlNull: true
});

// Or per-query configuration
const posts = await repository.find({
    where: {
        text: null
    },
    treatJsNullAsSqlNull: true
});
```

In this case, the query will only return posts where the `text` column is `NULL` in the database.

## Throwing on Undefined Values

The `throwOnUndefinedInFind` option allows you to catch potential programming errors by throwing when `undefined` values are encountered in find operations:

```typescript
// Connection-level configuration
const dataSource = new DataSource({
    // ... other options
    throwOnUndefinedInFind: true
});

// Or per-query configuration
const posts = await repository.find({
    where: {
        text: undefined // This will throw an error
    },
    throwOnUndefinedInFind: true
});
```

When this option is enabled, the following error will be thrown if an undefined value is encountered:
```
TypeORMError: Undefined value encountered in property 'text' of the find operation. Set 'throwOnUndefinedInFind' to false in connection options to skip properties with undefined values.
```

Note that this only applies to explicitly set `undefined` values. Properties that are not provided in the where clause are still ignored:

```typescript
// This will NOT throw an error, even with throwOnUndefinedInFind enabled
const posts = await repository.find({
    where: {
        title: "My Post" // text property is not provided, so it's ignored
    }
});
```

## Using Both Options Together

You can use both options together to have strict handling of both `null` and `undefined` values:

```typescript
const dataSource = new DataSource({
    // ... other options
    treatJsNullAsSqlNull: true,
    throwOnUndefinedInFind: true
});
```

This configuration will:
1. Transform JavaScript `null` values to SQL `NULL` in where conditions
2. Throw an error if any `undefined` values are encountered
3. Still ignore properties that are not provided in the where clause

This combination is useful when you want to:
- Be explicit about searching for NULL values in the database
- Catch potential programming errors where undefined values might slip into your queries
- Maintain the convenience of partial where conditions
