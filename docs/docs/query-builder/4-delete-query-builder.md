# Delete using Query Builder

## `Delete`

You can create `DELETE` queries using `QueryBuilder`.
Examples:

```typescript
await myDataSource
    .createQueryBuilder()
    .delete()
    .from(User)
    .where("id = :id", { id: 1 })
    .execute()
```

This is the most efficient way in terms of performance to delete entities from your database.

## `Delete` with an alias

On the PostgreSQL family (Postgres, CockroachDB) you can pass an alias when creating the query
builder, and use it in `where()`:

```typescript
await myDataSource
    .createQueryBuilder(User, "user")
    .delete()
    .where("user.id = :id", { id: 1 })
    .execute()
```

Which will produce the following SQL query:

```sql
DELETE FROM users user WHERE user.id = 1
```

On other database drivers `DELETE` doesn't support aliases, so `where()` conditions must stay
unqualified (e.g. `"id = :id"`).

## `Soft-Delete`

Applying Soft Delete to QueryBuilder

```typescript
await dataSource.getRepository(Entity).createQueryBuilder().softDelete()
```

Examples:

```typescript
await myDataSource
    .getRepository(User)
    .createQueryBuilder()
    .softDelete()
    .where("id = :id", { id: 1 })
    .execute()
```

## `Restore-Soft-Delete`

Alternatively, You can recover the soft deleted rows by using the `restore()` method:

```typescript
await dataSource.getRepository(Entity).createQueryBuilder().restore()
```

Examples:

```typescript
await myDataSource
    .getRepository(User)
    .createQueryBuilder()
    .restore()
    .where("id = :id", { id: 1 })
    .execute()
```
