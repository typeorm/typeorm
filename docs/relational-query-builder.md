# Working with Relations

`RelationQueryBuilder` is special type of `QueryBuilder` which allows you to work with your relations.
Using it you can bind entities to each other in the database without need to load any entities.
Or you can load related entities easily.
Examples:

For example we have a `Post` entity and it has a many-to-many relation to `Category` called `categories`.
Let's add a new category to this many-to-many relation:
                       
```typescript
import {getConnection} from "typeorm";

await getConnection()
    .createQueryBuilder()
    .relation(Post, "categories")
    .of(post)
    .add(category);
```

This code is equivalent to doing this:
       
```typescript
import {getManager} from "typeorm";

const postRepository = getRepository(Post);
const post = await postRepository.findOne(1, { relations: ["categories"] });
post.categories.push(category);
await postRepository.save(post);
```

But more efficient because it does a minimal number of operations and binds entities in the database,
unlike calling bulky `save` method call.

Also, other benefit of such an approach is that you don't need to load every related entity before pushing into it.
For example if you have ten thousand categories inside a single post, adding a new post to this list may become problematic for you, 
because the standard way of doing this, is to load the post with all ten thousand categories, push a new category
and save it. This results in very heavy performance and basically inapplicable in production results.
However, using `RelationQueryBuilder` solves this problem.

Also, there is no real need to use entities when you "bind" things, you can use entity ids instead.
For example, lets add a category with id = 3 into post with id = 1:

```typescript
import {getConnection} from "typeorm";

await getConnection()
    .createQueryBuilder()
    .relation(Post, "categories")
    .of(1)
    .add(3);
```

If you are using composite primary keys you have to pass them as id map, for example:

```typescript
import {getConnection} from "typeorm";

await getConnection()
    .createQueryBuilder()
    .relation(Post, "categories")
    .of({ firstPostId: 1, secondPostId: 3 })
    .add({ firstCategoryId: 2, secondCategoryId: 4 });
```

Same way you add new entities, you can remove them:    
         
```typescript
import {getConnection} from "typeorm";

// this code removes a category from a given post
await getConnection()
    .createQueryBuilder()
    .relation(Post, "categories")
    .of(post) // you can use just post id as well
    .remove(category); // you can use just category id as well
```

Adding and removing related entities works in `many-to-many` and `one-to-many` relations.
For `one-to-one` and `many-to-one` relations use `set` instead:

```typescript
import {getConnection} from "typeorm";

// this code sets category of a given post
await getConnection()
    .createQueryBuilder()
    .relation(Post, "categories")
    .of(post) // you can use just post id as well
    .set(category); // you can use just category id as well
```

If you want to unset a relation (set it to null), simply pass `null` to a `set` method:

```typescript
import {getConnection} from "typeorm";

// this code unsets category of a given post
await getConnection()
    .createQueryBuilder()
    .relation(Post, "categories")
    .of(post) // you can use just post id as well
    .set(null);
```

Besides updating relations, the relational query builder also allows you to load relational entities.
For example, lets say inside a `Post` entity we have a many-to-many `categories` relation and a many-to-one `user` relation.
To load those relations you can use following code:

```typescript
import {getConnection} from "typeorm";

const post = await getConnection().manager.findOne(Post, 1);

post.categories = await getConnection()
    .createQueryBuilder()
    .relation(Post, "categories")
    .of(post) // you can use just post id as well
    .loadMany();

post.author = await getConnection()
    .createQueryBuilder()
    .relation(User, "user")
    .of(post) // you can use just post id as well
    .loadOne();
```
