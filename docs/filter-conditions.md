# Filter Conditions

## What is a Filter Condition?

Filter conditions allow you to specify global conditions that automatically filter entity rows from query results. This is useful for implementing row-level security or other features that require static, global conditions without having to explicitly add where clauses to every query.

This feature aims to ensure that filtered entities can never show up in any query builder results, whether you're loading them directly or through a relation.

## Basic Usage

The `rawFilterCondition` property accepts a function that receives the column name and should return a SQL condition string.
To add a filter condition to an entity column, use the `rawFilterCondition` property on the `@Column` decorator:

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from "typeorm"
@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column({
        rawFilterCondition: (column) => `${column} = FALSE`,
    })
    isDeactivated: boolean
}
```

Now, any queries for User entities will automatically exclude rows where `isDeactivated` is not `false`. The filter condition applies to both repository methods and query builder operations:

```typescript
// Will only return non-deactivated users
const users = await userRepository.find()

// Also filters out deactivated users
const users = await userRepository.createQueryBuilder("user").getMany()
```

The generated SQL:

```sql
SELECT "User"."id" AS "User_id",
       "User"."isDeactivated" AS "User_isDeactivated"
FROM "user" "User"
WHERE ("User_isDeactivated" = FALSE)
```

## Disabling Filter Conditions

You can disable filter conditions for a specific query by setting `applyFilterConditions` to `false` in the find options:

```typescript
// Will return all users, including deactivated ones
const users = await userRepository.find({
    applyFilterConditions: false,
})

// Also works with query builder
const users = await userRepository
    .createQueryBuilder("user")
    .setFindOptions({
        applyFilterConditions: false,
    })
    .getMany()
```

## Selective Filter Conditions

You can selectively disable specific filter conditions while keeping others active by passing an entity-like object to `applyFilterConditions`:

```typescript
const users = await userRepository.find({
    applyFilterConditions: {
        isDeactivated: false, // Disable the isDeactivated filter
        isUnlisted: true, // Keep the isUnlisted filter active (default)
    },
})
```

## Cascading Filter Conditions

For one-to-one and many-to-one relations, you can use `filterConditionCascade` to make filter conditions cascade through relations. When a related entity is filtered out, the current entity will also be filtered from results:

```typescript
@Entity()
export class Post {
    @ManyToOne(() => User, {
        filterConditionCascade: true,
    })
    author: User
}
```

Now, if a post's author is deactivated, that post will also be filtered out of query results.

This is achieved using INNER JOINs in the generated SQL:

```sql
SELECT
    "Post"."id" AS "Post_id",
    "Post"."authorId" AS "Post_authorId"
FROM
    "post" "Post"
    INNER JOIN "user" "User" ON "User"."id" = "Post"."authorId"
    AND ("User"."isDeactivated" = FALSE)
```

Cascading filter conditions are robust, and will work through all kinds of relations and at any depth in an intuitive manner. It uses a combination of INNER JOINs and subqueries to achieve this.

For example, if you want to fetch a Category of Posts, and Posts should be filtered out if their `author` (User) is deactivated.

```typescript
@Entity()
export class Category {
    @OneToMany(() => Post, (post) => post.category)
    posts: Post[]
}
```

Now if you fetch category with the `posts` relation, the posts will be filtered out if their `author` is deactivated, with SQL that looks something like this:

```sql
SELECT
    "Category"."id" AS "Category_id",
    "Post"."id" AS "Post_id",
    "Post"."authorId" AS "Post_authorId"
FROM "category" "Category"
LEFT JOIN (
    SELECT
        "Post".*
    FROM "post" "Post"
    INNER JOIN "user" "User" ON "User"."id" = "Post"."authorId"
    AND ("User"."isDeactivated" = FALSE)
) "Post" ON "Post"."categoryId" = "Category"."id"
```

Sometimes you have your own conditions set on a join when you use QueryBuilder. In that case, a duplicate join is created in order to avoid conflicts between the filter condition and your own conditions.

To demonstrate one scenario in which a duplicate join is created, say we have the following entities:

```typescript
@Entity()
export class User {
    @Column()
    name: string

    @Column({
        rawFilterCondition: (column) => `${column} = FALSE`,
    })
    isDeactivated: boolean
}

@Entity()
export class Post {
    @ManyToOne(() => User)
    user: User
}
```

Now, if we want to fetch comments with their `user`, but we have some additional condition we want to apply on the `user` join, we might have to do something like this:

```typescript
const comments = await commentRepository
    .createQueryBuilder("comment")
    .leftJoinAndSelect("comment.user", "user", "user.name ILIKE :name", {
        name: "%John%",
    })
    .getMany()
```

In order to avoid conflicts between the filter condition and our additional condition, a duplicate join is created with a `_cfc` suffix.

The generated SQL:

```sql
SELECT
    "post"."id" AS "post_id",
    "post"."title" AS "post_title",
    "post"."authorId" AS "post_authorId",
    "author"."id" AS "author_id",
    "author"."name" AS "author_name",
    "author"."isDeactivated" AS "author_isDeactivated",
FROM
    "post" "post"
    LEFT JOIN "user" "author" ON "author"."id" = "post"."authorId"
    AND ("author"."name" ILIKE :name)
    INNER JOIN "user" "author_cfc" ON "author_cfc"."id" = "post"."authorId" -- Duplicate join
    AND (
        "author_cfc"."isDeactivated" = FALSE
    )
```

Although these additional joins and subqueries add overhead, it is an efficient way to implement true row-level security at the query builder level.

You can disable cascading filter conditions for specific relations, the same way you disable any other filter conditions:

```typescript
const posts = await postRepository.find({
    applyFilterConditions: {
        author: {
            isDeactivated: false,
        },
    },
})
```

## Working with Relations

If you have queries that load one-to-many or many-to-many relations, the join condition on the relation will automatically include the filter conditions of the related entity, unless disabled with the `applyFilterConditions` option.
