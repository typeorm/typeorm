# Performance and optimization in TypeORM

## 1. Introduction to performance optimization

- In applications using ORM like TypeORM, performance optimization is crucial to ensure the system runs smoothly, minimizes latency, and uses resources efficiently.

- Common challenges when using ORM include unnecessary data retrieval, N+1 query problems, and not leveraging optimization tools such as indexing or caching.

- The main goals of optimization include:
    - Reducing the number of SQL queries sent to the database.
    - Optimizing complex queries to run faster.
    - Using caching and indexing to speed up data retrieval.
    - Ensuring efficient data retrieval using appropriate loading methods (Lazy vs. Eager loading).

## 2. Efficient use of Query Builder

### 2.1. Avoiding the N+1 Query Problem

- The N+1 Query Problem occurs when the system executes too many sub-queries for each row of data retrieved.

- To avoid this, you can use `leftJoinAndSelect` or `innerJoinAndSelect` to combine tables in a single query instead of executing multiple queries.

```typescript
const users = await dataSource
    .getRepository(User)
    .createQueryBuilder("user")
    .leftJoinAndSelect("user.posts", "post")
    .getMany()
```

- Here, `leftJoinAndSelect` helps retrieve all user posts in a single query rather than many small queries.

### 2.2. Use `getRawMany()` when only raw data is needed

- In cases where full objects aren't required, you can use `getRawMany()` to fetch raw data and avoid TypeORM processing too much information.

```typescript
const rawPosts = await dataSource
    .getRepository(Post)
    .createQueryBuilder("post")
    .select("post.title, post.createdAt")
    .getRawMany()
```

### 2.3. Limit fields using `select`

- To optimize memory usage and reduce unnecessary data, select only the required fields using `select`.

```typescript
const users = await dataSource
    .getRepository(User)
    .createQueryBuilder("user")
    .select(["user.name", "user.email"])
    .getMany()
```

## 3. Using indices

- Indexes speed up query performance in the database by reducing the amount of data scanned. TypeORM supports creating indexes on table columns using the `@Index` decorator.

### 3.1. Creating an index

- Indexes can be created directly in entities using the `@Index` decorator.

```typescript
import { Entity, Column, Index } from "typeorm"

@Entity()
@Index(["firstName", "lastName"]) // Composite index
export class User {
    @Column()
    firstName: string

    @Column()
    lastName: string
}
```

### 3.2. Unique index

- You can create unique indexes to ensure no duplicate values in a column.

```typescript
@Index(["email"], { unique: true })
```

## 4. Lazy loading and Eager Loading

TypeORM provides two main methods for loading data relations: Lazy Loading and Eager Loading. Each has a different impact on the performance of your application.

### 4.1. Lazy loading

- Lazy loading loads the relation data only when needed, reducing database load when all related data isn't always necessary.

```typescript
@Entity()
export class User {
    @OneToMany(() => Post, (post) => post.user, { lazy: true })
    posts: Promise<Post[]>
}
```

- When you need to retrieve the data, simply call

```typescript
const user = await userRepository.findOne(userId)
const posts = await user.posts
```

- Advantages:
    - Resource efficiency: Only loads the necessary data when actually required, reducing query costs and memory usage.
    - Ideal for selective data usage: Suitable for scenarios where not all related data is needed.
- Disadvantages:
    - Increased query complexity: Each access to related data triggers an additional query to the database, which may increase latency if not managed properly.
    - Difficult to track: Can lead to the n+1 query problem if used carelessly.

### 4.2. Eager Loading

- Eager loading automatically retrieves all related data when the main query is executed. This can be convenient but may cause performance issues if there are too many complex relations.

```typescript
@Entity()
export class User {
    @OneToMany(() => Post, (post) => post.user, { eager: true })
    posts: Post[]
}
```

- In this case, posts will be loaded as soon as user data is retrieved.

- Advantages:
    - Automatically loads related data, making it easier to access relationships without additional queries.
    - Avoids the n+1 query problem: Since all data is fetched in a single query, there's no risk of generating unnecessary multiple queries.
- Disadvantages:
    - Fetching all related data at once may result in large queries, even if not all data is needed.
    - Not suitable for scenarios where only a subset of related data is required, as it can lead to inefficient data usage.

- To explore more details and examples of how to configure and use lazy and eager relations, visit the official TypeORM documentation: [Eager and Lazy Relations](../relations/5-eager-and-lazy-relations.md)

## 5. Advanced optimization

### 5.1. Using Query Hints

- Query Hints are instructions sent along with SQL queries, helping the database decide on more efficient execution strategies.

- Different RDBMS systems support different kinds of hints, such as suggesting index usage or choosing the appropriate JOIN type.

```typescript
await dataSource.query(`
    SELECT /*+ MAX_EXECUTION_TIME(1000) */ *
    FROM user
    WHERE email = 'example@example.com'
`)
```

- In the example above, `MAX_EXECUTION_TIME(1000)` instructs MySQL to stop the query if it takes more than 1 second.

### 5.2. Pagination

- Pagination is a crucial technique for improving performance when retrieving large amounts of data. Instead of fetching all data at once, pagination divides data into smaller pages, reducing database load and optimizing memory usage.

- In TypeORM, you can use `limit` and `offset` for pagination.

```typescript
const users = await userRepository
    .createQueryBuilder("user")
    .limit(10) // Number of records to fetch per page
    .offset(20) // Skip the first 20 records
    .getMany()
```

- Pagination helps prevent fetching large amounts of data at once, minimizing latency and optimizing memory usage. When implementing pagination, consider using pagination cursors for more efficient handling of dynamic data.

### 5.3. Caching

- Caching is the technique of temporarily storing query results or data for use in future requests without querying the database each time.

- TypeORM has built-in caching support, and you can customize how caching is used.

```typescript
const users = await userRepository
    .createQueryBuilder("user")
    .cache(true) // Enable caching
    .getMany()
```

- Additionally, you can configure cache duration or use external caching tools like Redis for better efficiency.

```typescript=
const dataSource = new DataSource({
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "test",
    password: "test",
    database: "test",
    cache: {
        type: "redis",
        options: {
            host: "localhost",
            port: 6379
        }
    }
});
```
