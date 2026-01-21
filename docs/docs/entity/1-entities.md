# Entities

## What is an Entity?

Entity is a class that maps to a database table (or collection when using MongoDB).
You can create an entity by defining a new class and mark it with `@Entity()`:

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from "typeorm"

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    firstName: string

    @Column()
    lastName: string

    @Column()
    isActive: boolean
}
```

This will create following database table:

```text
+-------------+--------------+----------------------------+
|                          user                           |
+-------------+--------------+----------------------------+
| id          | int          | PRIMARY KEY AUTO_INCREMENT |
| firstName   | varchar(255) |                            |
| lastName    | varchar(255) |                            |
| isActive    | boolean      |                            |
+-------------+--------------+----------------------------+
```

Basic entities consist of columns and relations.
Each entity **MUST** have a primary column (or ObjectId column if are using MongoDB).

Each entity must be registered in your data source options:

```typescript
import { DataSource } from "typeorm"
import { User } from "./entities/User"

const myDataSource = new DataSource({
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "test",
    password: "test",
    database: "test",
    entities: [User],
})
```

Or you can specify the whole directory with all entities inside - and all of them will be loaded:

```typescript
import { DataSource } from "typeorm"

const dataSource = new DataSource({
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "test",
    password: "test",
    database: "test",
    entities: [__dirname + "/entities/**/*{.js,.ts}"],
})
```

If you want to use an alternative table name for the `User` entity you can specify it in `@Entity`: `@Entity("my_users")`.
If you want to set a base prefix for all database tables in your application you can specify `entityPrefix` in data source options.

When using an entity constructor its arguments **must be optional**. Since ORM creates instances of entity classes when loading from the database, therefore it is not aware of your constructor arguments.

Learn more about parameters `@Entity` in [Decorators reference](../help/3-decorator-reference.md).

## Entity columns

Since database tables consist of columns your entities must consist of columns too.
Each entity class property you marked with `@Column` will be mapped to a database table column.

### Primary columns

Each entity must have at least one primary column.
There are several types of primary columns:

- `@PrimaryColumn()` creates a primary column which takes any value of any type. You can specify the column type. If you don't specify a column type it will be inferred from the property type. The example below will create id with `int` as type which you must manually assign before save.

```typescript
import { Entity, PrimaryColumn } from "typeorm"

@Entity()
export class User {
    @PrimaryColumn()
    id: number
}
```

- `@PrimaryGeneratedColumn()` creates a primary column which value will be automatically generated with an auto-increment value. It will create `int` column with `auto-increment`/`serial`/`sequence`/`identity` (depend on the database and configuration provided). You don't have to manually assign its value before save - value will be automatically generated.

```typescript
import { Entity, PrimaryGeneratedColumn } from "typeorm"

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number
}
```

- `@PrimaryGeneratedColumn("uuid")` creates a primary column which value will be automatically generated with `uuid`. Uuid is a unique string id. You don't have to manually assign its value before save - value will be automatically generated.

```typescript
import { Entity, PrimaryGeneratedColumn } from "typeorm"

@Entity()
export class User {
    @PrimaryGeneratedColumn("uuid")
    id: string
}
```

You can have composite primary columns as well:

```typescript
import { Entity, PrimaryColumn } from "typeorm"

@Entity()
export class User {
    @PrimaryColumn()
    firstName: string

    @PrimaryColumn()
    lastName: string
}
```

When you save entities using `save` it always tries to find an entity in the database with the given entity id (or ids).
If id/ids are found then it will update this row in the database.
If there is no row with the id/ids, a new row will be inserted.

To find an entity by id you can use `manager.findOneBy` or `repository.findOneBy`. Example:

```typescript
// find one by id with single primary key
const person = await dataSource.manager.findOneBy(Person, { id: 1 })
const person = await dataSource.getRepository(Person).findOneBy({ id: 1 })

// find one by id with composite primary keys
const user = await dataSource.manager.findOneBy(User, {
    firstName: "Timber",
    lastName: "Saw",
})
const user = await dataSource.getRepository(User).findOneBy({
    firstName: "Timber",
    lastName: "Saw",
})
```

### Special columns

There are several special column types with additional functionality available:

- `@CreateDateColumn` is a special column that is automatically set to the entity's insertion date.
  You don't need to set this column - it will be automatically set.

- `@UpdateDateColumn` is a special column that is automatically set to the entity's update time
  each time you call `save` of entity manager or repository, or during `upsert` operations when an update occurs.
  You don't need to set this column - it will be automatically set.

- `@DeleteDateColumn` is a special column that is automatically set to the entity's delete time each time you call soft-delete of entity manager or repository. You don't need to set this column - it will be automatically set. If the @DeleteDateColumn is set, the default scope will be "non-deleted".

- `@VersionColumn` is a special column that is automatically set to the version of the entity (incremental number)
  each time you call `save` of entity manager or repository, or during `upsert` operations when an update occurs.
  You don't need to set this column - it will be automatically set.

## Column types

TypeORM supports all of the most commonly used database-supported column types.
Column types are database-type specific - this provides more flexibility on how your database schema will look like.

You can specify column type as first parameter of `@Column`
or in the column options of `@Column`, for example:

```typescript
@Column("int")
```

or

```typescript
@Column({ type: "int" })
```

If you want to specify additional type parameters you can do it via column options.
For example:

```typescript
@Column("varchar", { length: 200 })
```

> Note about `bigint` type: `bigint` column type, used in SQL databases, doesn't fit into the regular `number` type and maps property to a `string` instead.

### `enum` column type

`enum` column type is supported by `postgres` and `mysql`. There are various possible column definitions:

Using typescript enums:

```typescript
export enum UserRole {
    ADMIN = "admin",
    EDITOR = "editor",
    GHOST = "ghost",
}

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column({
        type: "enum",
        enum: UserRole,
        default: UserRole.GHOST,
    })
    role: UserRole
}
```

> Note: String, numeric and heterogeneous enums are supported.

Using array with enum values:

```typescript
export type UserRoleType = "admin" | "editor" | "ghost",

@Entity()
export class User {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        type: "enum",
        enum: ["admin", "editor", "ghost"],
        default: "ghost"
    })
    role: UserRoleType
}
```

### `simple-array` column type

There is a special column type called `simple-array` which can store primitive array values in a single string column.
All values are separated by a comma. For example:

```typescript
@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column("simple-array")
    names: string[]
}
```

```typescript
const user = new User()
user.names = ["Alexander", "Alex", "Sasha", "Shurik"]
```

Will be stored in a single database column as `Alexander,Alex,Sasha,Shurik` value.
When you'll load data from the database, the names will be returned as an array of names,
just like you stored them.

Note you **MUST NOT** have any comma in values you write.

### `simple-json` column type

There is a special column type called `simple-json` which can store any values which can be stored in database
via JSON.stringify.
Very useful when you do not have json type in your database and you want to store and load object
without any hassle.
For example:

```typescript
@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column("simple-json")
    profile: { name: string; nickname: string }
}
```

```typescript
const user = new User()
user.profile = { name: "John", nickname: "Malkovich" }
```

Will be stored in a single database column as `{"name":"John","nickname":"Malkovich"}` value.
When you'll load data from the database, you will have your object/array/primitive back via JSON.parse

### Columns with generated values

You can create column with generated value using `@Generated` decorator. For example:

```typescript
@Entity()
export class User {
    @PrimaryColumn()
    id: number

    @Column()
    @Generated("uuid")
    uuid: string
}
```

`uuid` value will be automatically generated and stored into the database.

Besides "uuid" there is also "increment", "identity" (Postgres 10+ only) and "rowid" (CockroachDB only) generated types, however there are some limitations
on some database platforms with this type of generation (for example some databases can only have one increment column,
or some of them require increment to be a primary key).

### Vector columns

Vector columns are supported on MariaDB/MySQL, Microsoft SQL Server, PostgreSQL (via [`pgvector`](https://github.com/pgvector/pgvector) extension) and SAP HANA Cloud, enabling storing and querying vector embeddings for similarity search and machine learning applications.

TypeORM supports both `vector` and `halfvec` column types across databases:

- `vector` - stores vectors as 4-byte floats (single precision)
    - MariaDB/MySQL: native `vector` type
    - Microsoft SQL Server: native `vector` type
    - PostgreSQL: `vector` type, available via `pgvector` extension
    - SAP HANA Cloud: alias for `real_vector` type
- `halfvec` - stores vectors as 2-byte floats (half precision) for memory efficiency
    - PostgreSQL: `halfvec` type, available via `pgvector` extension
    - SAP HANA Cloud: alias for `half_vector` type

You can specify the number of vector dimensions using the `length` option:

```typescript
@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    // Vector without specified dimensions
    @Column("vector")
    embedding: number[] | Buffer

    // Vector with 3 dimensions: vector(3)
    @Column("vector", { length: 3 })
    embedding_3d: number[] | Buffer

    // Half-precision vector with 4 dimensions: halfvec(4) (works on PostgreSQL and SAP HANA only)
    @Column("halfvec", { length: 4 })
    halfvec_embedding: number[] | Buffer
}
```

> **Note**:
>
> - **MariaDB/MySQL**: Vectors are supported since MariaDB 11.7 and MySQL 9
> - **Microsoft SQL Server**: Vector type support requires SQL Server 2025 (17.x) or newer.
> - **PostgreSQL**: Vector columns require the `pgvector` extension to be installed. The extension provides the vector data types and similarity operators.
> - **SAP HANA**: Vector columns require SAP HANA Cloud (2024Q1+) and a supported version of `@sap/hana-client`.

### Spatial columns

Microsoft SQLServer, MySQL/MariaDB, PostgreSQL/CockroachDB and SAP HANA all support spatial columns. TypeORM's support for each varies slightly between databases, particularly as the column names vary between databases.

MS SQL, MySQL/MariaDB and SAP HANA use geometries in the [well-known text
(WKT)](https://en.wikipedia.org/wiki/Well-known_text) format, so geometry columns
should be tagged with the `string` type.

```typescript
import { Entity, PrimaryColumn, Column } from "typeorm"

@Entity()
export class Thing {
    @PrimaryColumn()
    id: number

    @Column("point")
    point: string

    @Column("linestring")
    linestring: string
}

...

const thing = new Thing()
thing.point = "POINT(1 1)"
thing.linestring = "LINESTRING(0 0,1 1,2 2)"
```

For Postgres/CockroachDB, see [Postgis Data Types](../drivers/postgres.md#spatial-columns)

## Column options

Column options defines additional options for your entity columns.
You can specify column options on `@Column`:

```typescript
@Column({
    type: "varchar",
    length: 150,
    unique: true,
    // ...
})
name: string;
```

List of available options in `ColumnOptions`:

- `type: ColumnType` - Column type. One of the type listed [above](#column-types).
- `name: string` - Column name in the database table.
  By default the column name is generated from the name of the property.
  You can change it by specifying your own name.

- `length: number` - Column type's length. For example if you want to create `varchar(150)` type you specify column type and length options.
- `onUpdate: string` - `ON UPDATE` trigger. Used only in [MySQL](https://dev.mysql.com/doc/refman/5.7/en/timestamp-initialization.html).
- `nullable: boolean` - Makes column `NULL` or `NOT NULL` in the database. By default column is `nullable: false`.
- `update: boolean` - Indicates if column value is updated by "save" operation. If false, you'll be able to write this value only when you first time insert the object. Default value is `true`.
- `insert: boolean` - Indicates if column value is set the first time you insert the object. Default value is `true`.
- `select: boolean` - Defines whether or not to hide this column by default when making queries. When set to `false`, the column data will not show with a standard query. By default column is `select: true`
- `default: string` - Adds database-level column's `DEFAULT` value.
- `primary: boolean` - Marks column as primary. Same if you use `@PrimaryColumn`.
- `unique: boolean` - Marks column as unique column (creates unique constraint).
- `comment: string` - Database's column comment. Not supported by all database types.
- `precision: number` - The precision for a decimal (exact numeric) column (applies only for decimal column), which is the maximum
  number of digits that are stored for the values. Used in some column types.
- `scale: number` - The scale for a decimal (exact numeric) column (applies only for decimal column), which represents the number of digits to the right of the decimal point and must not be greater than precision. Used in some column types.
- `unsigned: boolean` - Puts `UNSIGNED` attribute on to a numeric column. Used only in MySQL.
- `charset: string` - Defines a column character set. Not supported by all database types.
- `collation: string` - Defines a column collation.
- `enum: string[]|AnyEnum` - Used in `enum` column type to specify list of allowed enum values. You can specify array of values or specify a enum class.
- `enumName: string` - Defines the name for the used enum.
- `asExpression: string` - Generated column expression. Used only in [MySQL](https://dev.mysql.com/doc/refman/5.7/en/create-table-generated-columns.html).
- `generatedType: "VIRTUAL"|"STORED"` - Generated column type. Used only in [MySQL](https://dev.mysql.com/doc/refman/5.7/en/create-table-generated-columns.html).
- `hstoreType: "object"|"string"` - Return type of `HSTORE` column. Returns value as string or as object. Used only in [Postgres](https://www.postgresql.org/docs/9.6/static/hstore.html).
- `array: boolean` - Used for postgres and cockroachdb column types which can be array (for example int[])
- `transformer: { from(value: DatabaseType): EntityType, to(value: EntityType): DatabaseType }` - Used to marshal properties of arbitrary type `EntityType` into a type `DatabaseType` supported by the database. Array of transformers are also supported and will be applied in natural order when writing, and in reverse order when reading. e.g. `[lowercase, encrypt]` will first lowercase the string then encrypt it when writing, and will decrypt then do nothing when reading.
- `utc: boolean` - Indicates if date values should be stored and retrieved in UTC timezone instead of local timezone. Only applies to `date` column type. Default value is `false` (uses local timezone for backward compatibility).

Note: most of those column options are RDBMS-specific and aren't available in `MongoDB`.

## Entity inheritance

You can reduce duplication in your code by using entity inheritance.

For example, you have `Photo`, `Question`, `Post` entities:

```typescript
@Entity()
export class Photo {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @Column()
    description: string

    @Column()
    size: string
}

@Entity()
export class Question {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @Column()
    description: string

    @Column()
    answersCount: number
}

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @Column()
    description: string

    @Column()
    viewCount: number
}
```

As you can see all those entities have common columns: `id`, `title`, `description`. To reduce duplication and produce a better abstraction we can create a base class called `Content` for them:

```typescript
export abstract class Content {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @Column()
    description: string
}
@Entity()
export class Photo extends Content {
    @Column()
    size: string
}

@Entity()
export class Question extends Content {
    @Column()
    answersCount: number
}

@Entity()
export class Post extends Content {
    @Column()
    viewCount: number
}
```

All columns (relations, embeds, etc.) from parent entities (parent can extend other entity as well)
will be inherited and created in final entities.

## Tree entities

TypeORM supports the Adjacency list and Closure table patterns of storing tree structures.

### Adjacency list

Adjacency list is a simple model with self-referencing.
Benefit of this approach is simplicity,
drawback is you can't load a big tree at once because of join limitations.
Example:

```typescript
import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
    OneToMany,
} from "typeorm"

@Entity()
export class Category {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @Column()
    description: string

    @ManyToOne((type) => Category, (category) => category.children)
    parent: Category

    @OneToMany((type) => Category, (category) => category.parent)
    children: Category[]
}
```

### Closure table

A closure table stores relations between parent and child in a separate table in a special way.
It's efficient in both reads and writes.
To learn more about closure table take a look at [this awesome presentation by Bill Karwin](https://www.slideshare.net/billkarwin/models-for-hierarchical-data).
Example:

```typescript
import {
    Entity,
    Tree,
    Column,
    PrimaryGeneratedColumn,
    TreeChildren,
    TreeParent,
    TreeLevelColumn,
} from "typeorm"

@Entity()
@Tree("closure-table")
export class Category {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @Column()
    description: string

    @TreeChildren()
    children: Category[]

    @TreeParent()
    parent: Category

    @TreeLevelColumn()
    level: number
}
```

## Table partitioning

Table partitioning allows you to split a large table into smaller, more manageable pieces called partitions. TypeORM supports table partitioning for PostgreSQL and MySQL.

You can configure partitioning using the `partition` option in the `@Entity` decorator:

```typescript
@Entity({
    name: "measurements",
    partition: {
        type: "RANGE",
        columns: ["logdate"],
        // PostgreSQL example - uses FROM/TO format (2 values)
        // For MySQL, use single VALUES LESS THAN values: ["2024-01-01"], ["2025-01-01"]
        partitions: [
            { name: "p2023", values: ["2023-01-01", "2024-01-01"] },
            { name: "p2024", values: ["2024-01-01", "2025-01-01"] }
        ]
    }
})
export class Measurement {
    @PrimaryColumn()
    id: number

    @PrimaryColumn()
    logdate: Date

    @Column()
    value: number
}
```

Learn more about table partitioning in the [Table Partitioning guide](./7-table-partitioning.md).

