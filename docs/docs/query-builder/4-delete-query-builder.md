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

## `Soft-Remove`

`softRemove` and `recover` are alternatives to `softDelete` and `restore` that work with entity instances.
Unlike `softDelete`, `softRemove` supports cascades and triggers `@BeforeSoftRemove` / `@AfterSoftRemove` listeners.

```typescript
const user = await myDataSource.getRepository(User).findOneBy({ id: 1 })
await myDataSource.getRepository(User).softRemove(user)
```

You can also soft-remove multiple entities at once:

```typescript
const users = await myDataSource.getRepository(User).find()
await myDataSource.getRepository(User).softRemove(users)
```

## `Recover`

You can recover soft-removed entities using `recover`:

```typescript
await myDataSource.getRepository(User).recover(user)
```

## Cascading Soft-Remove

If your relations are configured with `cascade: ["soft-remove"]`, related entities will be soft-removed automatically:

```typescript
@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @OneToMany((type) => Photo, (photo) => photo.user, {
        cascade: ["soft-remove", "recover"],
    })
    photos: Photo[]

    @DeleteDateColumn({ nullable: true })
    deletedAt?: Date
}
```

```typescript
const user = await myDataSource.getRepository(User).findOne({
    where: { id: 1 },
    relations: { photos: true },
})
await myDataSource.getRepository(User).softRemove(user)
// user and all related photos are soft-removed
```

Recovering works the same way when `cascade: ["recover"]` is set:

```typescript
await myDataSource.getRepository(User).recover(user)
// user and all related photos are recovered
```

> **Note:** Entity listeners `@BeforeSoftRemove` and `@AfterSoftRemove` are triggered by `softRemove` but not by `softDelete`.
> See [Listeners and Subscribers](../advanced-topics/4-listeners-and-subscribers.md) for details.
