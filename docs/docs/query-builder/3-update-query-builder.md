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

## `Update` with an alias

On the PostgreSQL family (Postgres, CockroachDB) you can pass an alias when creating the query
builder, and use it in `where()`:

```typescript
await dataSource
    .createQueryBuilder(User, "user")
    .update()
    .set({ firstName: "Timber", lastName: "Saw" })
    .where("user.id = :id", { id: 1 })
    .execute()
```

Which will produce the following SQL query:

```sql
UPDATE users user SET firstName = 'Timber', lastName = 'Saw' WHERE user.id = 1
```

On other database drivers `UPDATE` doesn't support aliases, so `where()` conditions must stay
unqualified (e.g. `"id = :id"`).

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
