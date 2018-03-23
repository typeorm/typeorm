# Entities

* [What is Entity?](#what-is-entity)
* [Entity columns](#entity-columns)
    * [Primary columns](#primary-columns)
    * [Special columns](#special-columns)
* [Column types](#column-types)
    * [Column types for `mysql` / `mariadb`](#column-types-for-mysql--mariadb)
    * [Column types for `postgres`](#column-types-for-postgres)
    * [Column types for `sqlite` / `websql`](#column-types-for-sqlite--websql--cordova)
    * [Column types for `mssql`](#column-types-for-mssql)
    * [`simple-array` column type](#simple-array-column-type)
    * [`simple-json` column type](#simple-json-column-type)
    * [Columns with generated values](#columns-with-generated-values)
* [Column options](#column-options)

## What is Entity?

Entity is a class that maps to a database table (or collection when using MongoDB).
You can create a entity by defining a new class and mark it with `@Entity()`:

```typescript
import {Entity, PrimaryGeneratedColumn, Column} from "typeorm";

@Entity()
export class User {
    
    @PrimaryGeneratedColumn()
    id: number;
    
    @Column()
    firstName: string;
    
    @Column()
    lastName: string;
    
    @Column()
    isActive: boolean;
    
}
```

This will create following database table:

```shell
+-------------+--------------+----------------------------+
|                          user                           |
+-------------+--------------+----------------------------+
| id          | int(11)      | PRIMARY KEY AUTO_INCREMENT |
| firstName   | varchar(255) |                            |
| lastName    | varchar(255) |                            |
| isActive    | boolean      |                            |
+-------------+--------------+----------------------------+
```

Basic entities consist of columns and relations. 
Each entity **MUST** have a primary column (or ObjectId column if are using MongoDB).

Each entity must be registered in your connection options:

```typescript
import {createConnection, Connection} from "typeorm";
import {User} from "./entity/User";

const connection: Connection = await createConnection({
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "test",
    password: "test",
    database: "test",
    entities: [User]
});
```

Or you can specify the whole directory with all entities inside - and all of them will be loaded:

```typescript
import {createConnection, Connection} from "typeorm";

const connection: Connection = await createConnection({
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "test",
    password: "test",
    database: "test",
    entities: ["entity/*.js"]
});
```

If you want to use an alternative table name for the `User` entity you can specify it in `@Entity`: `@Entity("my_users")`.
If you want to set a base prefix for all database tables in your application you can specify `entityPrefix` in connection options.

When using an entity constructor its arguments **must be optional**. Since ORM creates instances of entity classes when loading from the database, therefore it is not aware of your constructor arguments.

Learn more about parameters @Entity in [Decorators reference](decorator-reference.md).

## Entity columns

Since database table consist of columns your entities must consist of columns too. 
Each entity class property you marked with `@Column` will be mapped to a database table column.

### Primary columns

Each entity must have at least one primary column.
There are several types of primary columns:

* `@PrimaryColumn()` creates a primary column which take any value of any type.
You can specify the column type. If you don't specify a column type it will be inferred from the property type.
Example below will create id with `int` as type which you must manually assign before save.

```typescript
import {Entity, PrimaryColumn} from "typeorm";

@Entity()
export class User {
    
    @PrimaryColumn()
    id: number;
    
   
}
```

* `@PrimaryGeneratedColumn()` creates a primary column which value will be automatically generated with an auto-increment value.
It will create `int` column with `auto-increment`/`serial`/`sequence` (depend on the database).
You don't have to manually assign its value before save - value will be automatically generated.

```typescript
import {Entity, PrimaryGeneratedColumn} from "typeorm";

@Entity()
export class User {
    
    @PrimaryGeneratedColumn()
    id: number;
    
   
}
```

* `@PrimaryGeneratedColumn("uuid")` creates a primary column which value will be automatically generated with `uuid`.
Uuid is a unique string id.
You don't have to manually assign its value before save - value will be automatically generated.

```typescript
import {Entity, PrimaryGeneratedColumn} from "typeorm";

@Entity()
export class User {
    
    @PrimaryGeneratedColumn("uuid")
    id: string;
    
   
}
```

You can have composite primary columns as well:

```typescript
import {Entity, PrimaryColumn} from "typeorm";

@Entity()
export class User {
    
    @PrimaryColumn()
    firstName: string;
    
    @PrimaryColumn()
    lastName: string;
    
}
```

When you save entities using `save` it always tries to find a entity in the database with the given entity id (or ids).
If id/ids are found then it will update this row in the database. 
If there is no row with the id/ids, a new row will be inserted.
 
To find a entity by id you can use `manager.findOneById` or `repository.findOneById`. Example:

```typescript
// find one by id with single primary key
const person = await connection.manager.findOneById(Person, 1);
const person = await connection.getRepository(Person).findOneById(1);

// find one by id with composite primary keys
const user = await connection.manager.findOneById(User, { firstName: "Umed", lastName: "Khudoiberdiev" });
const user = await connection.getRepository(User).findOneById({ firstName: "Umed", lastName: "Khudoiberdiev" });
```

### Special columns

There are several special column types with additional functionality available:

* `@CreateDateColumn` is a special column that is automatically set to the entity's insertion date.
You don't need set this column - it will be automatically set.

* `@UpdateDateColumn` is a special column that is automatically set to the entity's update time 
each time you call `save` of entity manager or repository.
You don't need set this column - it will be automatically set.

* `@VersionColumn` is a special column that is automatically set to the version of the entity (incremental number)  
each time you call `save` of entity manager or repository.
You don't need set this column - it will be automatically set.

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

or 
 
```typescript
@Column({ type: "int", length: 200 })
```

### Column types for `mysql` / `mariadb`

`int`, `tinyint`, `smallint`, `mediumint`, `bigint`, `decimal`, `float`, `double`, 
`real`, `datetime`, `time`, `timestamp`, `character`, `varchar`, `char`, `tinyblob`,
`tinytext`, `mediumblob`, `mediumtext`, `blob`, `text`, `longblob`, `longtext`, `date`,
`year`, `enum`, `json`

### Column types for `postgres`

`int`, `int2`, `int4`, `int8`, `integer`, `smallint`, `bigint`, `float4`, `float8`,
`numeric`, `decimal`, `real`, `double precision`, `time`, `time with time zone`,
`time without time zone`, `timestamp`, `timestamp without time zone`, `timestamp with time zone`,
`character varying`, `character`, `varchar`, `char`, `text`, `citext`,
`smallserial`, `serial2`, `serial`, `serial4`, `bigserial`, `serial8`, 
`money`, `boolean`, `bool` `bytea`, `date`, `interval`, `point`, `line`, `lseg`, `box`, 
`circle`, `path`, `polygon`, `cidr`, `inet`, `macaddr`, `bit`, `bit varying`,
 `varbit`, `tsvector`, `tsquery`, `uuid`, `xml`, `json`, `jsonb` 

### Column types for `sqlite` / `websql` / `cordova`

`int`, `int2`, `int8`, `integer`, `tinyint`, `smallint`, `mediumint`, `bigint`, `decimal`,
`numeric`, `float`, `double`, `real`, `double precision`, `datetime`, `varying character`,
`character`, `native character`, `varchar`, `nchar`, `nvarchar2`, `unsigned big int`, `boolean`, 
`blob`, `text`, `clob`, `date`
 
### Column types for `mssql`

`int`, `tinyint`, `smallint`, `bigint`, `dec`, `decimal`, `numeric`, `float`, `dec`, `decimal`, 
`numeric`, `real`, `datetime`, `datetime2`, `datetimeoffset`, `time`, `timestamp`, 
`nvarchar`, `varchar`, `char`, `nchar`, `binary`, `varbinary`,
`bit`, `smallmoney`, `money`, `text`, `ntext`, `image`, `smalldatetime`, `date`, `xml`, `varbinary`,
`cursor`, `hierarchyid`, `sql_variant`, `table`
  
### `simple-array` column type

There is a special column type called `simple-array` which can store primitive array values in a single string column.
All values are separated by a comma. For example:

```typescript
@Entity()
export class User {
    
    @PrimaryGeneratedColumn()
    id: number;
 
    @Column("simple-array")
    names: string[];
    
}
```
```typescript
const user = new User();
user.names = [
    "Alexander",
    "Alex",
    "Sasha",
    "Shurik"
];
```

Will be stored in a single database column as `Alexander,Alex,Sasha,Shurik` value.
When you'll load data from the database, the names will be returned as an array of names, 
just like you stored them.

Note you **MUST NOT** have any comma in values you write.

### `simple-json` column type

There is a special column type called `simple-json` which can store any values which can be stored in database
via JSON.stringify.
Very useful when you do not have json type in your database and you want to store and load object
without any hustle.
For example:

```typescript
@Entity()
export class User {
    
    @PrimaryGeneratedColumn()
    id: number;
 
    @Column("simple-json")
    profile: { name: string, nickname: string };
    
}
```
```typescript
const user = new User();
user.profile = { name: "John", nickname: "Malkovich" };
```

Will be stored in a single database column as `{"name":"John","nickname":"Malkovich"}` value.
When you'll load data from the database, you will have your object/array/primitive back via JSON.parse

### Columns with generated values

You can create column with generated value using `@Generated` decorator. For example:

```typescript
@Entity()
export class User {
    
    @PrimaryColumn()
    id: number;
 
    @Column()
    @Generated("uuid")
    uuid: string;
    
}
```

`uuid` value will be automatically generated and stored into the database.
 
Besides "uuid" there is also "increment" generated type, however there are some limitations 
on some database platforms with this type of generation (for example some databases can only have one increment column,
or some of them require increment to be a primary key). 
 
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

* `type: ColumnType` - Column type. One of the type listed [above](#column-types).
* `name: string` - Column name in the database table. 
By default the column name is generated from the name of the property.
You can change it by specifying your own name
* `length: number` - Column type's length. For example if you want to create `varchar(150)` type 
you specify column type and length options.
* `nullable: boolean` - Makes column `NULL` or `NOT NULL` in the database. 
By default column is `nullable: false`.
* `default: string` - Adds database-level column's `DEFAULT` value. 
* `primary: boolean` - Marks column as primary. Same if you use `@PrimaryColumn`.
* `unique: boolean` - Marks column as unique column (creates unique constraint).
* `comment: string` - Database's column comment. Not supported by all database types.
* `precision: number` - The precision for a decimal (exact numeric) column (applies only for decimal column), which is the maximum
 number of digits that are stored for the values. Used in some column types.
* `scale: number` - The scale for a decimal (exact numeric) column (applies only for decimal column), 
which represents the number of digits to the right of the decimal point and must not be greater than precision. 
Used in some column types.
* `charset: string` - Defines a column character set. Not supported by all database types.
* `collation: string` - Defines a column collation.
* `enum: string[]|AnyEnum` - Used in `enum` column type to specify list of allowed enum values.
You can specify array of values or specify a enum class.
* `array: boolean` - Used for postgres column types which can be array (for example int[])
* `transformer: { from(value: DatabaseType): EntityType, to(value: EntityType): DatabaseType }` - Used to
marshal properties of arbitrary type `EntityType` into a type `DatabaseType` supported by the database.
* `select: boolean` - Defines whether or not to hide this column by default when making queries. When set to `false`, the column data will not show with a standard query. By default column is `select: true`

Note: most of those column options are RDBMS-specific and aren't available in `MongoDB`.

## Entity inheritance

You can reduce duplication in your code by using entity inheritance. 

For example, you have `Photo`, `Question`, `Post` entities:
  
```typescript
@Entity()
export class Photo {
    
    @PrimaryGeneratedColumn()
    id: number;
 
    @Column()
    title: string;
    
    @Column()
    description: string;
    
    @Column()
    size: string;
    
}

@Entity()
export class Question {
    
    @PrimaryGeneratedColumn()
    id: number;
 
    @Column()
    title: string;
    
    @Column()
    description: string;
    
    @Column()
    answersCount: number;
    
}

@Entity()
export class Post {
    
    @PrimaryGeneratedColumn()
    id: number;
 
    @Column()
    title: string;
    
    @Column()
    description: string;
    
    @Column()
    viewCount: number;
    
}
```

As you can see all those entities have common columns: `id`, `title`, `description`.
To reduce duplication and produce a better abstraction we can create a base class called `Content` for them:


```typescript
export abstract class Content {
    
    @PrimaryGeneratedColumn()
    id: number;
 
    @Column()
    title: string;
    
    @Column()
    description: string;
    
}
@Entity()
export class Photo extends Content {
    
    @Column()
    size: string;
    
}

@Entity()
export class Question extends Content {
    
    @Column()
    answersCount: number;
    
}

@Entity()
export class Post extends Content {
    
    @Column()
    viewCount: number;
    
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
import {Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany} from "typeorm";

@Entity()
export class Category {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    description: string;

    @OneToMany(type => Category, category => category.children)
    parent: Category;

    @ManyToOne(type => Category, category => category.parent)
    children: Category;
}
     
```

### Closure table


A closure table stores relations between parent and child in a separate table in a special way. 
Its efficient in both reads and writes. 
To learn more about closure table take a look at [this awesome presentation by Bill Karwin](https://www.slideshare.net/billkarwin/models-for-hierarchical-data). 
Example:

```typescript
import {ClosureEntity, Column, PrimaryGeneratedColumn, TreeChildren, TreeParent, TreeLevelColumn} from "typeorm";

@ClosureEntity()
export class Category {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    description: string;

    @TreeChildren()
    children: Category;

    @TreeParent()
    parent: Category;

    @TreeLevelColumn()
    level: number;
}
```
