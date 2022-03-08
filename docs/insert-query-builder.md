# Insert using Query Builder

You can create `INSERT` queries using `QueryBuilder`.
Examples:

```typescript
await dataSource
    .createQueryBuilder()
    .insert()
    .into(User)
    .values([
        { firstName: "Timber", lastName: "Saw" },
        { firstName: "Phantom", lastName: "Lancer" },
    ])
    .execute()
```

This is the most efficient way in terms of performance to insert rows into your database.
You can also perform bulk insertions this way.

### Raw SQL support

In some cases when you need to execute SQL queries you need to use function style value:

```typescript
await dataSource
    .createQueryBuilder()
    .insert()
    .into(User)
    .values({
        firstName: "Timber",
        lastName: () => "CONCAT('S', 'A', 'W')",
    })
    .execute()
```

This syntax doesn't escape your values, you need to handle escape on your own.
