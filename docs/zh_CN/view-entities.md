# 视图实体

* [什么是视图实体?](#什么是视图实体)
* [视图实体列](#视图实体列)
* [完整示例](#完整示例)

## 什么是视图实体?

视图实体是一个映射到数据库视图的类。
你可以通过定义一个新类来创建一个视图实体，并用`@ViewEntity()`来标记：

`@ViewEntity()` 接收以下参数：

* `name` - 视图名称。 如果未指定，则从实体类名生成视图名称。
* `database` - 所选DB服务器中的数据库名称。
* `schema` - 架构名称。
* `expression` - 视图定义。 **必需参数**。

`expression`可以是带有正确转义的列和表的字符串，取决于所使用的数据库（示例中为postgres）：

```typescript
@ViewEntity({ 
    expression: `
        SELECT "post"."id" "id", "post"."name" AS "name", "category"."name" AS "categoryName"
        FROM "post" "post"
        LEFT JOIN "category" "category" ON "post"."categoryId" = "category"."id"
    `
})
```

或者是QueryBuilder的一个实例

```typescript
@ViewEntity({ 
    expression: (connection: Connection) => connection.createQueryBuilder()
        .select("post.id", "id")
        .addSelect("post.name", "name")
        .addSelect("category.name", "categoryName")
        .from(Post, "post")
        .leftJoin(Category, "category", "category.id = post.categoryId")
})
```

**注意:** 由于驱动程序的限制，不支持参数绑定。请改用文字参数。

```typescript
@ViewEntity({ 
    expression: (connection: Connection) => connection.createQueryBuilder()
        .select("post.id", "id")
        .addSelect("post.name", "name")
        .addSelect("category.name", "categoryName")
        .from(Post, "post")
        .leftJoin(Category, "category", "category.id = post.categoryId")
        .where("category.name = :name", { name: "Cars" })  // <-- 这是错的
        .where("category.name = 'Cars'")                   // <-- 这是对的
})
```

每个视图实体都必须在连接选项中注册：

```typescript
import {createConnection, Connection} from "typeorm";
import {UserView} from "./entity/UserView";

const connection: Connection = await createConnection({
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "test",
    password: "test",
    database: "test",
    entities: [UserView]
});
```
或者你可以指定包含所有实体的整个目录 - 所有实体都将被加载：

```typescript
import {createConnection, Connection} from "typeorm";

const connection: Connection = await createConnection({
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "test",
    password: "test",
    database: "test",
    entities: ["entity/*.js"]
});
```

## 视图实体列

要将视图中的数据映射到正确的实体列，必须使用`@ViewColumn()`装饰器标记实体列，并将这些列指定为select语句别名。

字符串表达式定义的示例：

```typescript
import {ViewEntity, ViewColumn} from "typeorm";

@ViewEntity({ 
    expression: `
        SELECT "post"."id" AS "id", "post"."name" AS "name", "category"."name" AS "categoryName"
        FROM "post" "post"
        LEFT JOIN "category" "category" ON "post"."categoryId" = "category"."id"
    `
})
export class PostCategory {

    @ViewColumn()
    id: number;

    @ViewColumn()
    name: string;

    @ViewColumn()
    categoryName: string;

}
```

使用QueryBuilder的示例：

```typescript
import {ViewEntity, ViewColumn} from "typeorm";

@ViewEntity({ 
    expression: (connection: Connection) => connection.createQueryBuilder()
        .select("post.id", "id")
        .addSelect("post.name", "name")
        .addSelect("category.name", "categoryName")
        .from(Post, "post")
        .leftJoin(Category, "category", "category.id = post.categoryId")
})
export class PostCategory {

    @ViewColumn()
    id: number;

    @ViewColumn()
    name: string;

    @ViewColumn()
    categoryName: string;

}
```

## 完整示例

让我们创建两个实体和一个包含来自这些实体的聚合数据的视图：

```typescript
import {Entity, PrimaryGeneratedColumn, Column} from "typeorm";

@Entity()
export class Category {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

}
```

```typescript
import {Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn} from "typeorm";
import {Category} from "./Category";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    categoryId: number;

    @ManyToOne(() => Category)
    @JoinColumn({ name: "categoryId" })
    category: Category;

}
```

```typescript
import {ViewEntity, ViewColumn} from "typeorm";

@ViewEntity({ 
    expression: (connection: Connection) => connection.createQueryBuilder()
        .select("post.id", "id")
        .addSelect("post.name", "name")
        .addSelect("category.name", "categoryName")
        .from(Post, "post")
        .leftJoin(Category, "category", "category.id = post.categoryId")
})
export class PostCategory {

    @ViewColumn()
    id: number;

    @ViewColumn()
    name: string;

    @ViewColumn()
    categoryName: string;

}
```

然后用数据填充这些表并从PostCategory视图请求所有数据：

```typescript
import {getManager} from "typeorm";
import {Category} from "./entity/Category";
import {Post} from "./entity/Post";
import {PostCategory} from "./entity/PostCategory";

const entityManager = getManager();

const category1 = new Category();
category1.name = "Cars";
await entityManager.save(category1);

const category2 = new Category();
category2.name = "Airplanes";
await entityManager.save(category2);

const post1 = new Post();
post1.name = "About BMW";
post1.categoryId = category1.id;
await entityManager.save(post1);

const post2 = new Post();
post2.name = "About Boeing";
post2.categoryId = category2.id;
await entityManager.save(post2);

const postCategories = await entityManager.find(PostCategory);
const postCategory = await entityManager.findOne(PostCategory, { id: 1 });
```

`postCategories`的结果将是：

```
[ PostCategory { id: 1, name: 'About BMW', categoryName: 'Cars' },
  PostCategory { id: 2, name: 'About Boeing', categoryName: 'Airplanes' } ]
```

在`postCategory`中：

```
PostCategory { id: 1, name: 'About BMW', categoryName: 'Cars' }
```


