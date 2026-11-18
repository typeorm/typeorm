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

## `Soft-Remove` and `Recover`

The `softDelete()` and `restore()` methods above run a single bulk `UPDATE` by criteria. That's efficient, but it doesn't load the entities, so it skips relation cascades and entity listeners or subscribers.

When you need those, use the repository or entity manager `softRemove()` and `recover()` methods instead. They work on entity instances, like `remove()` and `save()`, cascade to related entities according to your cascade options, and fire the `@BeforeSoftRemove`, `@AfterSoftRemove`, `@BeforeRecover`, and `@AfterRecover` listeners.

```typescript
const repository = dataSource.getRepository(User)

// load the entities, then soft-delete them
// (cascades and the @...SoftRemove listeners run, unlike softDelete)
const users = await repository.find()
const softRemovedUsers = await repository.softRemove(users)

// recover them later
await repository.recover(softRemovedUsers)
```

Use `softDelete()` / `restore()` for efficient bulk updates by criteria, and `softRemove()` / `recover()` when you have loaded entities and need cascades or lifecycle hooks.

See the [Repository API](../working-with-entity-manager/6-repository-api.md) and [Listeners and Subscribers](../listeners-and-subscribers.md) for more.
