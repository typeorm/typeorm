# Lazy and Eager Loading

TypeORM provides two main methods for loading data relations: Lazy Loading and Eager Loading. Each has a different impact on the performance of your application.

## Lazy loading

Lazy loading loads the relation data only when needed, reducing database load when all related data isn't always necessary.

```typescript
@Entity()
export class User {
    @OneToMany(() => Post, (post) => post.user, { lazy: true })
    posts: Promise<Post[]>
}
```

When you need to retrieve the data, simply call

```typescript
const user = await userRepository.findOne(userId)
const posts = await user.posts
```

Advantages:

- Resource efficiency: Only loads the necessary data when actually required, reducing query costs and memory usage.
- Ideal for selective data usage: Suitable for scenarios where not all related data is needed.

Disadvantages:

- Increased query complexity: Each access to related data triggers an additional query to the database, which may increase latency if not managed properly.
- Difficult to track: Can lead to the n+1 query problem if used carelessly.

## Eager Loading

Eager loading automatically retrieves all related data when the main query is executed. This can be convenient but may cause performance issues if there are too many complex relations.

```typescript
@Entity()
export class User {
    @OneToMany(() => Post, (post) => post.user, { eager: true })
    posts: Post[]
}
```

In this case, posts will be loaded as soon as user data is retrieved.

Advantages:

- Automatically loads related data, making it easier to access relationships without additional queries.
- Avoids the n+1 query problem: Since all data is fetched in a single query, there's no risk of generating unnecessary multiple queries.

Disadvantages:

- Fetching all related data at once may result in large queries, even if not all data is needed.
- Not suitable for scenarios where only a subset of related data is required, as it can lead to inefficient data usage.

To explore more details and examples of how to configure and use lazy and eager relations, visit the official TypeORM documentation: [Eager and Lazy Relations](../relations/5-eager-and-lazy-relations.md)
