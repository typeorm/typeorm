# Pagination

Pagination is a crucial technique for improving performance when retrieving large amounts of data. Instead of fetching all data at once, pagination divides data into smaller pages, reducing database load and optimizing memory usage.

In TypeORM, you can use `limit` and `offset` for pagination.

```typescript
const users = await userRepository
    .createQueryBuilder("user")
    .limit(10) // Number of records to fetch per page
    .offset(20) // Skip the first 20 records
    .getMany()
```

Pagination helps prevent fetching large amounts of data at once, minimizing latency and optimizing memory usage. When implementing pagination, consider using pagination cursors for more efficient handling of dynamic data.
