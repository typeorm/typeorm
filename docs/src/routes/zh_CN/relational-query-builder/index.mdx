# 与 Relations 结合

`RelationQueryBuilder`是`QueryBuilder`的一种允许你使用关系来查询的特殊类型。
通过使用你可以在数据库中将实体彼此绑定，而无需加载任何实体，或者可以轻松地加载相关实体。
例如：

例如，我们有一个`Post`实体，它与`Category`有一个多对多的关系，叫做`categories`。
让我们为这种多对多关系添加一个新 category：

```typescript
import { getConnection } from "typeorm";

await getConnection()
  .createQueryBuilder()
  .relation(Post, "categories")
  .of(post)
  .add(category);
```

这段代码相当于：

```typescript
import { getManager } from "typeorm";

const postRepository = getRepository(Post);
const post = await postRepository.findOne(1, { relations: ["categories"] });
post.categories.push(category);
await postRepository.save(post);
```

但是这样使用第一种方式效率更高，因为它执行的操作数量最少，并且绑定数据库中的实体，这比每次都调用`save`这种笨重的方法简化了很多。

此外，这种方法的另一个好处是不需要在 pushing 之前加载每个相关实体。
例如，如果你在一个 post 中有一万个 categories，那么在此列表中添加新 posts 可能会产生问题，因为执行此操作的标准方法是加载包含所有一万个 categories 的 post，push 一个新 category 然后保存。 这将会导致非常高的性能成本，而且基本上不适用于生产环境。
但是，使用`RelationQueryBuilder`则解决了这个问题。

此外，当进行绑定时，可以不需要使用实体，只需要使用实体 ID 即可。
例如，让我们在 id 为 1 的 post 中添加 id = 3 的 category：

```typescript
import { getConnection } from "typeorm";

await getConnection()
  .createQueryBuilder()
  .relation(Post, "categories")
  .of(1)
  .add(3);
```

如果你使用了复合主键，则必须将它们作为 id 映射传递，例如：

```typescript
import { getConnection } from "typeorm";

await getConnection()
  .createQueryBuilder()
  .relation(Post, "categories")
  .of({ firstPostId: 1, secondPostId: 3 })
  .add({ firstCategoryId: 2, secondCategoryId: 4 });
```

也可以按照添加实体的方式删除实体：

```typescript
import { getConnection } from "typeorm";

// 此代码从给定的post中删除一个category
await getConnection()
  .createQueryBuilder()
  .relation(Post, "categories")
  .of(post) // 也可以使用post id
  .remove(category); // 也可以只使用category ID
```

添加和删除相关实体针对`多对多`和`一对多`关系。
对于`一对一`和`多对一`关系，请使用`set`代替：

```typescript
import { getConnection } from "typeorm";

// 此代码set给定post的category
await getConnection()
  .createQueryBuilder()
  .relation(Post, "categories")
  .of(post) // 也可以使用post id
  .set(category); // 也可以只使用category ID
```

如果要取消设置关系（将其设置为 null），只需将`null`传递给`set`方法：

```typescript
import { getConnection } from "typeorm";

// 此代码取消设置给定post的category
await getConnection()
  .createQueryBuilder()
  .relation(Post, "categories")
  .of(post) // 也可以使用post id
  .set(null);
```

除了更新关系外，关系查询构建器还允许你加载关系实体。
例如，假设在`Post`实体内部，我们有多对多的`categories`关系和多对一的`user`关系，为加载这些关系，你可以使用以下代码：

```typescript
import { getConnection } from "typeorm";

const post = await getConnection().manager.findOne(Post, 1);

post.categories = await getConnection()
  .createQueryBuilder()
  .relation(Post, "categories")
  .of(post) // 也可以使用post id
  .loadMany();

post.author = await getConnection()
  .createQueryBuilder()
  .relation(User, "user")
  .of(post) // 也可以使用post id
  .loadOne();
```
