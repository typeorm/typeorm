# Filter Conditions

## What is a Filter Condition?

Filter conditions allow you to specify global conditions that automatically filter entity rows from query results. This is useful for implementing features like row-level security, multi-tenancy, etc. without having to explicitly add where clauses to every query.

This feature aims to ensure that filtered entities can never show up in any query builder results, whether you're loading them directly or through a relation.

## Basic Usage

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

The `rawFilterCondition` property accepts a function that receives the column name and should return a SQL condition string:

```typescript
@Column({
    rawFilterCondition: (column) => `${column} IS NULL`,
})
deletedAt: Date

@Column({
    rawFilterCondition: (column) => `${column} = :tenantId`,
})
tenantId: number
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
        isUnlisted: true, // Keep the isUnlisted filter active.
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