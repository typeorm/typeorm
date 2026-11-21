# Update using Query Builder

You can create `UPDATE` queries using `QueryBuilder`.
Examples:

```typescript
await dataSource
    .createQueryBuilder()
    .update(User)
    .set({ firstName: "Timber", lastName: "Saw" })
    .where("id = :id", { id: 1 })
    .execute()
```

This is the most efficient way in terms of performance to update entities in your database.

When you pass an array to `whereEntity(entities)` on an update, soft-delete, or restore
builder, TypeORM remembers the entity objects present at that point. You can clear or
reuse the array before `execute()`: TypeORM still refreshes the original objects when
entity updates are enabled. Empty slots in a sparse array are skipped.

## Raw SQL support

In some cases when you need to execute SQL queries you need to use function style value:

```typescript
await dataSource
    .createQueryBuilder()
    .update(User)
    .set({
        firstName: "Timber",
        lastName: "Saw",
        age: () => "age + 1",
    })
    .where("id = :id", { id: 1 })
    .execute()
```

> Warning: When using raw SQL, ensure that values are properly sanitized to prevent SQL injection.
