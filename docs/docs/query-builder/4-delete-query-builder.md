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

On PostgreSQL and CockroachDB, `softDelete()` and `restore()` can refresh the
objects passed to `whereEntity()` by their original IDs. This applies with
automatic or column-list `RETURNING` and a single untransformed primary key
represented as a JavaScript number. Supported column types are PostgreSQL
`smallint` and `integer`, and CockroachDB `int2` (also called `smallint`) and
`int4`. CockroachDB's default `INT` is a 64-bit `int8` and falls outside this
scope. If an input row is missing, its object keeps its previous values. Request
the ID explicitly to include it in the returned columns.

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
