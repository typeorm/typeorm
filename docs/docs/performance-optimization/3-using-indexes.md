---
sidebar_label: Indexes
---

# Using indexes

Indexes speed up query performance in the database by reducing the amount of data scanned. TypeORM supports creating indexes on table columns using the `@Index` decorator.

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

For a comprehensive overview of different types of indexes, read the [Indexes](../indexes.md) guide.
