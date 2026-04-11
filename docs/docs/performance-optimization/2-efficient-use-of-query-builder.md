---
sidebar_label: Query Builder
---

# Efficient use of Query Builder

## Avoiding the N+1 Query Problem

The N+1 Query Problem occurs when the system executes too many sub-queries for each row of data retrieved.

To avoid this, you can use `leftJoinAndSelect` or `innerJoinAndSelect` to combine tables in a single query instead of executing multiple queries.

```typescript
const users = await dataSource
    .getRepository(User)
    .createQueryBuilder("user")
    .leftJoinAndSelect("user.posts", "post")
    .getMany()
```

Here, `leftJoinAndSelect` helps retrieve all user posts in a single query rather than many small queries.

## Use `getRawMany()` when only raw data is needed

In cases where full objects aren't required, you can use `getRawMany()` to fetch raw data and avoid TypeORM processing too much information.

```typescript
const rawPosts = await dataSource
    .getRepository(Post)
    .createQueryBuilder("post")
    .select("post.title, post.createdAt")
    .getRawMany()
```

## Limit fields using `select`

To optimize memory usage and reduce unnecessary data, select only the required fields using `select`.

```typescript
const users = await dataSource
    .getRepository(User)
    .createQueryBuilder("user")
    .select(["user.name", "user.email"])
    .getMany()
```
