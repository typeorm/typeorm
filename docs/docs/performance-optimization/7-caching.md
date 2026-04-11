# Caching

Caching is the technique of temporarily storing query results or data for use in future requests without querying the database each time.

TypeORM has built-in caching support, and you can customize how caching is used.

```typescript
const users = await userRepository
    .createQueryBuilder("user")
    .cache(true) // Enable caching
    .getMany()
```

Additionally, you can configure cache duration or use external caching tools like Redis for better efficiency.

```typescript
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
            port: 6379,
        },
    },
})
```
