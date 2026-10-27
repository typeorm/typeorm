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

### Querying soft-deleted entities with relations

When you use `@DeleteDateColumn`, TypeORM automatically adds a `deletedAt IS NULL` condition to all queries and joins. The `withDeleted()` method removes this filter **globally** — from the main entity and all joins:

```typescript
// All soft-deleted users, conversations, and messages are included
const users = await dataSource
    .createQueryBuilder(User, "user")
    .leftJoinAndSelect("user.conversations", "conversation")
    .leftJoinAndSelect("conversation.messages", "message")
    .withDeleted()
    .getMany()
```

If you need to include soft-deleted rows only on a **specific join** (e.g. show deleted conversations but hide deleted messages), use `withDeletedJoin()`:

```typescript
// Only soft-deleted conversations are included; messages still filtered
const users = await dataSource
    .createQueryBuilder(User, "user")
    .leftJoinAndSelect("user.conversations", "conversation")
    .withDeletedJoin()
    .leftJoinAndSelect("conversation.messages", "message")
    .getMany()
```

See the [Select QueryBuilder > Using Soft Deleting](./1-select-query-builder.md#using-soft-deleting) section for the full API reference.

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
