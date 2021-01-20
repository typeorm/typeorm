# View Entities

* [What is View Entity?](#what-is-view-entity)
* [View Entity columns](#view-entity-columns)
* [Complete example](#complete-example)

## What is View Entity?

View entity is a class that maps to a database view.
You can create a view entity by defining a new class and mark it with `@ViewEntity()`:

`@ViewEntity()` accepts following options:

* `name` - view name. If not specified, then view name is generated from entity class name.
* `database` - database name in selected DB server.
* `schema` - schema name.
* `expression` - view definition. **Required parameter**.

`expression` can be string with properly escaped columns and tables, depend on database used (postgres in example):

```typescript
@ViewEntity({ 
    expression: `
        SELECT "post"."id" AS "id", "post"."name" AS "name", "category"."name" AS "categoryName"
        FROM "post" "post"
        LEFT JOIN "category" "category" ON "post"."categoryId" = "category"."id"
    `
})
```

or an instance of QueryBuilder

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

**Note:** parameter binding is not supported due to drivers limitations. Use the literal parameters instead.

```typescript
@ViewEntity({ 
    expression: (connection: Connection) => connection.createQueryBuilder()
        .select("post.id", "id")
        .addSelect("post.name", "name")
        .addSelect("category.name", "categoryName")
        .from(Post, "post")
        .leftJoin(Category, "category", "category.id = post.categoryId")
        .where("category.name = :name", { name: "Cars" })  // <-- this is wrong
        .where("category.name = 'Cars'")                   // <-- and this is right
})
```

Each view entity must be registered in your connection options:

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

Or you can specify the whole directory with all entities inside - and all of them will be loaded:

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

## View Entity columns

To map data from view into the correct entity columns you must mark entity columns with `@ViewColumn()`
decorator and specify these columns as select statement aliases. 

example with string expression definition:

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

example using QueryBuilder:

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

## Complete example

Let create two entities and a view containing aggregated data from these entities:

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

then fill these tables with data and request all data from PostCategory view:

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

the result in `postCategories` will be:

```
[ PostCategory { id: 1, name: 'About BMW', categoryName: 'Cars' },
  PostCategory { id: 2, name: 'About Boeing', categoryName: 'Airplanes' } ]
```

and in `postCategory`:

```
PostCategory { id: 1, name: 'About BMW', categoryName: 'Cars' }
```


