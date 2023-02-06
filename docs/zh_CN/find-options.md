# Find 选项

  * [基础选项](#基础选项)
  * [进阶选项](#进阶选项)

## 基础选项

所有存储库和管理器`find`方法都接受可用于查询所需数据的特殊选项，而无需使用`QueryBuilder`：

-   `select` - 表示必须选择对象的哪些属性

```typescript
userRepository.find({ select: ["firstName", "lastName"] });
```

-   `relations` - 关系需要加载主体。 也可以加载子关系（`join` 和 `leftJoinAndSelect` 的简写）

```typescript
userRepository.find({ relations: ["profile", "photos", "videos"] });
userRepository.find({ relations: ["profile", "photos", "videos", "videos.video_attributes"] });
```

-   `join` - 需要为实体执行联接，扩展版的"relations"。

```typescript
userRepository.find({
    join: {
        alias: "user",
        leftJoinAndSelect: {
            profile: "user.profile",
            photo: "user.photos",
            video: "user.videos"
        }
    }
});
```

-   `where` -查询实体的简单条件。

```typescript
userRepository.find({ where: { firstName: "Timber", lastName: "Saw" } });
```

查询嵌入实体列应该根据定义它的层次结构来完成。 例：

```typescript
userRepository.find({ where: { name: { first: "Timber", last: "Saw" } } });
```

使用 OR 运算符查询：

```typescript
userRepository.find({
    where: [{ firstName: "Timber", lastName: "Saw" }, { firstName: "Stan", lastName: "Lee" }]
});
```

将执行以下查询：

```sql
SELECT * FROM "user" WHERE ("firstName" = 'Timber' AND "lastName" = 'Saw') OR ("firstName" = 'Stan' AND "lastName" = 'Lee')
```

-   `order` - 选择排序

```typescript
userRepository.find({
    order: {
        name: "ASC",
        id: "DESC"
    }
});
```

返回多个实体的`find`方法（`find`，`findAndCount`，`findByIds`），同时也接受以下选项：

-   `skip` - 偏移（分页）

```typescript
userRepository.find({
    skip: 5
});
```

-   `take` - limit (分页) - 得到的最大实体数。

```typescript
userRepository.find({
    take: 10
});
```

\*\* 如果你正在使用带有 MSSQL 的 typeorm，并且想要使用`take`或`limit`，你必须正确使用 order，否则将会收到以下错误：`'FETCH语句中NEXT选项的使用无效。'`

```typescript
userRepository.find({
    order: {
        columnName: "ASC"
    },
    skip: 0,
    take: 10
});
```

-   `cache` - 启用或禁用查询结果缓存。 有关更多信息和选项，请参见[caching](caching.md)。

```typescript
userRepository.find({
    cache: true
});
```

* `lock` - 启用锁查询。 只能在`findOne`方法中使用。 `lock`是一个对象，可以定义为：
```ts
{ mode: "optimistic", version: number|Date }
```
或者
```ts
{ mode: "pessimistic_read"|"pessimistic_write"|"dirty_read" }
```

例如:

```typescript
userRepository.findOne(1, {
    lock: { mode: "optimistic", version: 1 }
})
```

find 选项的完整示例：

```typescript
userRepository.find({
    select: ["firstName", "lastName"],
    relations: ["profile", "photos", "videos"],
    where: {
        firstName: "Timber",
        lastName: "Saw"
    },
    order: {
        name: "ASC",
        id: "DESC"
    },
    skip: 5,
    take: 10,
    cache: true
});
```

## 进阶选项

TypeORM 提供了许多内置运算符，可用于创建更复杂的查询：

-   `Not`

```ts
import { Not } from "typeorm";

const loadedPosts = await connection.getRepository(Post).find({
    title: Not("About #1")
});
```

将执行以下查询：

```sql
SELECT * FROM "post" WHERE "title" != 'About #1'
```

-   `LessThan`

```ts
import { LessThan } from "typeorm";

const loadedPosts = await connection.getRepository(Post).find({
    likes: LessThan(10)
});
```

将执行以下查询：

```sql
SELECT * FROM "post" WHERE "likes" < 10
```

-   `LessThanOrEqual`

```ts
import { LessThanOrEqual } from "typeorm";
const loadedPosts = await connection.getRepository(Post).find({
    likes: LessThanOrEqual(10)
});
```

将执行以下查询：

```sql
SELECT * FROM "post" WHERE "likes" <= 10
```

-   `MoreThan`

```ts
import { MoreThan } from "typeorm";

const loadedPosts = await connection.getRepository(Post).find({
    likes: MoreThan(10)
});
```

将执行以下查询：

```sql
SELECT * FROM "post" WHERE "likes" > 10
```

-   `MoreThanOrEqual`

```ts
import { MoreThanOrEqual } from "typeorm";
const loadedPosts = await connection.getRepository(Post).find({
    likes: MoreThanOrEqual(10)
});
```

将执行以下查询：

```sql
SELECT * FROM "post" WHERE "likes" >= 10
```

-   `Equal`

```ts
import { Equal } from "typeorm";

const loadedPosts = await connection.getRepository(Post).find({
    title: Equal("About #2")
});
```

将执行以下查询：

```sql
SELECT * FROM "post" WHERE "title" = 'About #2'
```

-   `Like`

```ts
import { Like } from "typeorm";

const loadedPosts = await connection.getRepository(Post).find({
    title: Like("%out #%")
});
```

将执行以下查询：

```sql
SELECT * FROM "post" WHERE "title" LIKE '%out #%'
```

-   `ILike`

```ts
import { ILike } from "typeorm";

const loadedPosts = await connection.getRepository(Post).find({
    title: ILike("%out #%")
});
```

将执行以下查询：

```sql
SELECT * FROM "post" WHERE "title" ILIKE '%out #%'
```

-   `Between`

```ts
import { Between } from "typeorm";

const loadedPosts = await connection.getRepository(Post).find({
    likes: Between(1, 10)
});
```

将执行以下查询：

```sql
SELECT * FROM "post" WHERE "likes" BETWEEN 1 AND 10
```

-   `In`

```ts
import { In } from "typeorm";

const loadedPosts = await connection.getRepository(Post).find({
    title: In(["About #2", "About #3"])
});
```

将执行以下查询：

```sql
SELECT * FROM "post" WHERE "title" IN ('About #2','About #3')
```

-   `Any`

```ts
import { Any } from "typeorm";

const loadedPosts = await connection.getRepository(Post).find({
    title: Any(["About #2", "About #3"])
});
```

将执行以下查询： (Postgres notation):

```sql
SELECT * FROM "post" WHERE "title" = ANY(['About #2','About #3'])
```

-   `IsNull`

```ts
import { IsNull } from "typeorm";

const loadedPosts = await connection.getRepository(Post).find({
    title: IsNull()
});
```

将执行以下查询：

```sql
SELECT * FROM "post" WHERE "title" IS NULL
```

-   `Raw`

```ts
import { Raw } from "typeorm";

const loadedPosts = await connection.getRepository(Post).find({
    likes: Raw("1 + likes = 4")
});
```

将执行以下查询：

```sql
SELECT * FROM "post" WHERE 1 + "likes" = 4
```

> 注意：注意`Raw`操作符。 它应该从提供的表达式执行纯 SQL，而不能包含用户输入，否则将导致 SQL 注入。

你还可以将这些运算符与`Not`运算符组合使用：

```ts
import { Not, MoreThan, Equal } from "typeorm";

const loadedPosts = await connection.getRepository(Post).find({
    likes: Not(MoreThan(10)),
    title: Not(Equal("About #2"))
});
```

将执行以下查询：

```sql
SELECT * FROM "post" WHERE NOT("likes" > 10) AND NOT("title" = 'About #2')
```
