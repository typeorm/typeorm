# `EntityManager` API

- `connection` - 使用`EntityManager`连接。

```typescript
const connection = manager.connection;
```

- `queryRunner` - `EntityManager`使用的查询运行器。仅在 EntityManager 的事务实例中使用。

```typescript
const queryRunner = manager.queryRunner;
```

- `transaction` - 提供在单个数据库事务中执行多个数据库请求的事务。
  更多关于 [事务](./transactions.md).

```typescript
await manager.transaction(async manager => {
  // NOTE: you must perform all database operations using the given manager instance
  // it's a special instance of EntityManager working with this transaction
  // and don't forget to await things here
  // 注意：你必须使用给定的管理器实例执行所有数据库操作，
  // 它是一个使用此事务的EntityManager的特殊实例。
  // 在这里处理一些操作
});
```

- `query` - 执行原始 SQL 查询。

```typescript
const rawData = await manager.query(`SELECT * FROM USERS`);
```

- `createQueryBuilder` - 创建用于构建 SQL 查询的 query builder。
  更多关于 [QueryBuilder](select-query-builder.md).

```typescript
const users = await manager
  .createQueryBuilder()
  .select()
  .from(User, "user")
  .where("user.name = :name", { name: "John" })
  .getMany();
```

- `hasId` - 检查给定实体是否已定义主列属性。

```typescript
if (manager.hasId(user)) {
  // ... 做一些需要的操作
}
```

- `getId` - 获取给定实体的主列属性值。
  如果实体具有复合主键，则返回的值将是具有主列的名称和值的对象。

```typescript
const userId = manager.getId(user); // userId === 1
```

- `create` - 创建`User`的新实例。 接受具有用户属性的对象文字，该用户属性将写入新创建的用户对象。（可选）

```typescript
const user = manager.create(User); // same as const user = new User();
const user = manager.create(User, {
  id: 1,
  firstName: "Timber",
  lastName: "Saw"
}); // 和 const user = new User(); user.firstName = "Timber"; user.lastName = "Saw"; 一样
```

- `merge` - 将多个实体合并为一个实体。

```typescript
const user = new User();
manager.merge(User, user, { firstName: "Timber" }, { lastName: "Saw" }); // 和user.firstName = "Timber"; user.lastName = "Saw";一样
```

- `preload` - 从给定的普通 javascript 对象创建一个新实体。 如果实体已存在于数据库中，则它将加载它（以及与之相关的所有内容），将所有值替换为给定对象中的新值，并返回新实体。 新的实体实际上是从与新对象代替所有属性的数据库实体加载。

```typescript
const partialUser = {
  id: 1,
  firstName: "Rizzrak",
  profile: {
    id: 1
  }
};
const user = await manager.preload(User, partialUser);
// user将包含partialUser中具有partialUser属性值的所有缺失数据：
// { id: 1, firstName: "Rizzrak", lastName: "Saw", profile: { id: 1, ... } }
```

- `save` - 保存给定实体或实体数组。
  如果实体已存在于数据库中，则会更新。
  如果该实体尚未存在于数据库中，则将其插入。
  它将所有给定实体保存在单个事务中（在实体管理器而不是事务性的情况下）。
  还支持部分更新，因为跳过了所有未定义的属性。 为了使值为`NULL`，你必须手动将该属性设置为等于`null`。

```typescript
await manager.save(user);
await manager.save([category1, category2, category3]);
```

- `remove` - 删除给定的实体或实体数组。
  它删除单个事务中的所有给定实体（在实体的情况下，管理器不是事务性的）。

```typescript
await manager.remove(user);
await manager.remove([category1, category2, category3]);
```

- `insert` - 插入新实体或实体数组。

```typescript
await manager.insert(User, {
  firstName: "Timber",
  lastName: "Timber"
});

await manager.insert(User, [
  {
    firstName: "Foo",
    lastName: "Bar"
  },
  {
    firstName: "Rizz",
    lastName: "Rak"
  }
]);
```

- `update` - 通过给定的更新选项或实体 ID 部分更新实体。

```typescript
await manager.update(User, { firstName: "Timber" }, { firstName: "Rizzrak" });
// 执行 UPDATE user SET firstName = Rizzrak WHERE firstName = Timber

await manager.update(User, 1, { firstName: "Rizzrak" });
// 执行 UPDATE user SET firstName = Rizzrak WHERE id = 1
```

- `delete` - 根据实体 id 或 ids 或其他给定条件删除实体：

```typescript
await manager.delete(User, 1);
await manager.delete(User, [1, 2, 3]);
await manager.delete(User, { firstName: "Timber" });
```

- `count` - 符合指定条件的实体数量。对分页很有用。

```typescript
const count = await manager.count(User, { firstName: "Timber" });
```

- `increment` - 增加符合条件的实体某些列值。

```typescript
await manager.increment(User, { firstName: "Timber" }, "age", 3);
```

- `decrement` - 减少符合条件的实体某些列值。

```typescript
await manager.decrement(User, { firstName: "Timber" }, "age", 3);
```

- `find` - 查找指定条件的实体。

```typescript
const timbers = await manager.find(User, { firstName: "Timber" });
```

- `findAndCount` - 查找指定条件的实体。
  还会计算与给定条件匹配的所有实体数量，但忽略分页设置（`from`和`take` 选项）。

```typescript
const [timbers, timbersCount] = await manager.findAndCount(User, { firstName: "Timber" });
```

- `findByIds` - 按 ID 查找多个实体。

```typescript
const users = await manager.findByIds(User, [1, 2, 3]);
```

- `findOne` - 查找匹配某些 ID 或查找选项的第一个实体。

```typescript
const user = await manager.findOne(User, 1);
const timber = await manager.findOne(User, { firstName: "Timber" });
```

- `findOneOrFail` - 查找匹配某些 ID 或查找选项的第一个实体。 如果没有匹配，则 Rejects 一个 promise。

```typescript
const user = await manager.findOneOrFail(User, 1);
const timber = await manager.findOneOrFail(User, { firstName: "Timber" });
```

- `clear` - 清除给定表中的所有数据(truncates/drops)。

```typescript
await manager.clear(User);
```

- `getRepository` - 获取`Repository`以对特定实体执行操作。
  更过关于 [Repositories](working-with-entity-manager.md).

```typescript
const userRepository = manager.getRepository(User);
```

- `getTreeRepository` - 获取`TreeRepository`以对特定实体执行操作。
  更多关于[Repositories](working-with-entity-manager.md).

```typescript
const categoryRepository = manager.getTreeRepository(Category);
```

- `getMongoRepository` - 获取`MongoRepository`以对特定实体执行操作。
  更多关于[MongoDB](./mongodb.md).

```typescript
const userRepository = manager.getMongoRepository(User);
```

- `getCustomRepository` - 获取自定义实体库。
  更多关于 [Custom repositories](working-with-entity-manager.md).

```typescript
const myUserRepository = manager.getCustomRepository(UserRepository);
```

- `release` - 释放实体管理器的查询运行器。仅在手动创建和管理查询运行器时使用。

```typescript
await manager.release();
```
