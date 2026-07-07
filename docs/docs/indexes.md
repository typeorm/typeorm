# Indexes

## Column indexes

You can create a database index for a specific column by using `@Index` on a column you want to make an index.
You can create indexes for any columns of your entity.
Example:

```typescript
import { Entity, PrimaryGeneratedColumn, Column, Index } from "typeorm"

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Index()
    @Column()
    firstName: string

    @Column()
    @Index()
    lastName: string
}
```

You can also specify an index name:

```typescript
import { Entity, PrimaryGeneratedColumn, Column, Index } from "typeorm"

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Index("name1-idx")
    @Column()
    firstName: string

    @Column()
    @Index("name2-idx")
    lastName: string
}
```

## Unique indexes

To create a unique index you need to specify `{ unique: true }` in the index options:

> Note: CockroachDB stores unique indexes as `UNIQUE` constraints

```typescript
import { Entity, PrimaryGeneratedColumn, Column, Index } from "typeorm"

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Index({ unique: true })
    @Column()
    firstName: string

    @Column()
    @Index({ unique: true })
    lastName: string
}
```

To control the sort order of a property-level unique index, both `@Unique` and `@Index` accept an `order` option:

```typescript
import { Entity, PrimaryGeneratedColumn, Column, Index, Unique } from "typeorm"

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Unique({ order: "DESC" })
    @Column()
    score: number

    @Unique("uq_created_at_desc", { order: "DESC" })
    @Column()
    createdAt: Date
}
```

`@Index({ unique: true, order: "DESC" })` is equivalent and can be used as an alternative. On databases that do not support ordering in unique index syntax (see [Unique constraints with per-column sort order](#unique-constraints-with-per-column-sort-order)), the `order` field is silently ignored.

## Indexes with multiple columns

To create an index with multiple columns you need to put `@Index` on the entity itself
and specify all column property names which should be included in the index.
Example:

```typescript
import { Entity, PrimaryGeneratedColumn, Column, Index } from "typeorm"

@Entity()
@Index(["firstName", "lastName"])
@Index(["firstName", "middleName", "lastName"], { unique: true })
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    firstName: string

    @Column()
    middleName: string

    @Column()
    lastName: string
}
```

## Indexes with per-column sort order

### Property-level

When using `@Index` on a property, pass `order` directly in the options:

```typescript
import { Entity, PrimaryGeneratedColumn, Column, Index } from "typeorm"

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Index({ order: "DESC" })
    @Column()
    createdAt: Date

    @Index("idx_score_desc", { order: "DESC" })
    @Column()
    score: number
}
```

### Entity-level (composite indexes)

To specify sort order for composite indexes, pass an array of objects with `field` and `order` properties instead of plain strings. Plain strings and objects can be mixed freely in the same array.

```typescript
import { Entity, PrimaryGeneratedColumn, Column, Index } from "typeorm"

@Entity()
@Index(["firstName", "lastName"]) // both ASC (default)
@Index([
    { field: "createdAt", order: "DESC" }, // most-recent first
    { field: "lastName", order: "ASC" },
    "firstName", // no order = ASC
])
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    firstName: string

    @Column()
    lastName: string

    @Column()
    createdAt: Date
}
```

You can combine per-column ordering with a custom index name and/or index options:

```typescript
// named index with ordering
@Index("idx_user_recent", [
    { field: "createdAt", order: "DESC" },
    { field: "lastName", order: "ASC" },
])

// unique index with ordering
@Index(["score", "createdAt"], { unique: true })
@Index([
    { field: "score", order: "DESC" },
    { field: "createdAt", order: "DESC" },
], { unique: true })

// named unique index with ordering
@Index("idx_user_top_recent", [
    { field: "score", order: "DESC" },
    { field: "createdAt", order: "DESC" },
], { unique: true })
```

Generated SQL (PostgreSQL example):

```sql
CREATE INDEX "idx_user_recent"
    ON "user" ("createdAt" DESC, "lastName" ASC)

CREATE UNIQUE INDEX "idx_user_top_recent"
    ON "user" ("score" DESC, "createdAt" DESC)
```

> Note: MySQL and SAP HANA do not support column ordering on `SPATIAL` or `FULLTEXT` indexes. Specifying `order` on columns of those index types has no effect.

## Unique constraints with per-column sort order

The `@Unique` decorator accepts the same `{ field, order }` objects as `@Index`, so you can control column sort order inside a unique constraint:

```typescript
import { Entity, PrimaryGeneratedColumn, Column, Unique } from "typeorm"

@Entity()
@Unique([
    { field: "score", order: "DESC" },
    { field: "createdAt", order: "DESC" },
])
@Unique("uq_user_recent", [{ field: "lastName", order: "ASC" }, "firstName"])
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    firstName: string

    @Column()
    lastName: string

    @Column()
    score: number

    @Column()
    createdAt: Date
}
```

**Database support** — sort ordering in unique constraints is not universal:

| Database       | Supported                                                                                                             |
| -------------- | --------------------------------------------------------------------------------------------------------------------- |
| SQL Server     | ✅ `CONSTRAINT name UNIQUE (col DESC)`                                                                                |
| MySQL ≥ 8.0    | ✅ stored as a unique index                                                                                           |
| MariaDB ≥ 10.8 | ✅ stored as a unique index                                                                                           |
| SAP HANA       | ✅ stored as a unique index                                                                                           |
| PostgreSQL     | ❌ ordering silently ignored (`UNIQUE` constraint syntax does not support it, use `@Index({ unique: true })` instead) |
| Oracle         | ❌ ordering silently ignored                                                                                          |
| CockroachDB    | ❌ ordering silently ignored                                                                                          |
| SQLite         | ❌ ordering silently ignored                                                                                          |

On databases that do not support ordering in unique constraint syntax the `order` field is accepted without error but has no effect on the generated SQL. Use `@Index({ unique: true })` with per-column ordering if you need a unique index with a guaranteed sort direction on those databases.

## Spatial Indexes

MySQL, CockroachDB and PostgreSQL (when PostGIS is available) supports spatial indexes.

To create a spatial index on a column in MySQL, add an `Index` with `spatial: true` on a column that uses a spatial type (`geometry`, `point`, `linestring`,
`polygon`, `multipoint`, `multilinestring`, `multipolygon`,
`geometrycollection`):

```typescript
@Entity()
export class Thing {
    @Column("point")
    @Index({ spatial: true })
    point: string
}
```

To create a spatial index on a column add an `Index` with `spatial: true` on a column that uses a spatial type (`geometry`, `geography`):

```typescript
export interface Geometry {
    type: "Point"
    coordinates: [Number, Number]
}

@Entity()
export class Thing {
    @Column("geometry", {
        spatialFeatureType: "Point",
        srid: 4326,
    })
    @Index({ spatial: true })
    point: Geometry
}
```

## Concurrent creation

In order to avoid having to obtain an ACCESS EXCLUSIVE lock when creating and dropping indexes in Postgres, you may create them using the CONCURRENTLY modifier.
If you want to use the concurrent option, you need to set `migrationsTransactionMode: none` in your data source options.

TypeORM supports generating SQL with this option when the concurrent option is specified on the index.

```typescript
@Index(["firstName", "middleName", "lastName"], { concurrent: true })
```

For more information see the [Postgres documentation](https://www.postgresql.org/docs/current/sql-createindex.html).

## Index Type

If you need to specify a custom type for the index, you can use the `type` property. If the `spatial` property is set, this field will be ignored.

```typescript
@Index({ type: 'hash' })
```

This feature is currently supported only for PostgreSQL.

## Disabling synchronization

TypeORM does not support some index options and definitions (e.g. `lower`, `pg_trgm`) due to many database-specific differences and multiple
issues with getting information about existing database indexes and synchronizing them automatically. In such cases you should create the index manually
(for example, in [the migrations](./migrations/01-why.md)) with any index signature you want. To make TypeORM ignore these indexes during synchronization, use `synchronize: false`
option on the `@Index` decorator.

For example, you create an index with case-insensitive comparison:

```sql
CREATE INDEX "POST_NAME_INDEX" ON "post" (lower("name"))
```

after that, you should disable synchronization for this index to avoid deletion on next schema sync:

```ts
@Entity()
@Index("POST_NAME_INDEX", { synchronize: false })
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string
}
```
