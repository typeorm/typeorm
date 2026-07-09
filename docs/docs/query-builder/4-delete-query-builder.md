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

`softDelete()` updates rows directly by criteria. If you need entity-level
cascades or subscribers/listeners to run, use `softRemove()` through the
repository or entity manager instead.

For example:

```typescript
const user = await dataSource.getRepository(User).findOneBy({ id: 1 })
if (user) {
    await dataSource.getRepository(User).softRemove(user)
}
```

See also the repository API docs for `softDelete` versus `softRemove`:
[working-with-entity-manager/6-repository-api.md](../working-with-entity-manager/6-repository-api.md).

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
