# 实体

- [实体](#实体)
  - [实体是什么?](#实体是什么)
  - [实体列](#实体列)
    - [主列](#主列)
    - [特殊列](#特殊列)
    - [空间列](#空间列)
  - [列类型](#列类型)
    - [`mysql`/`mariadb`的列类型](#mysqlmariadb的列类型)
    - [`postgres`的列类型](#postgres的列类型)
    - [`sqlite`/`cordova`/`react-native`/`expo`的列类型](#sqlitecordovareact-nativeexpo的列类型)
    - [`mssql`的列类型](#mssql的列类型)
    - [`oracle`的列类型](#oracle的列类型)
    - [`enum` 列类型](#enum-列类型)
    - [`simple-array`的列类型](#simple-array的列类型)
    - [`simple-json` 列类型](#simple-json-列类型)
    - [具有生成值的列](#具有生成值的列)
  - [列选项](#列选项)
  - [实体继承](#实体继承)
  - [树实体](#树实体)
    - [邻接列表](#邻接列表)
    - [Closure 表](#closure-表)

## 实体是什么?

实体是一个映射到数据库表（或使用 MongoDB 时的集合）的类。
你可以通过定义一个新类来创建一个实体，并用`@Entity()`来标记：

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

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

这将创建以下数据库表：

```bash
+-------------+--------------+----------------------------+
|                          user                           |
+-------------+--------------+----------------------------+
| id          | int(11)      | PRIMARY KEY AUTO_INCREMENT |
| firstName   | varchar(255) |                            |
| lastName    | varchar(255) |                            |
| isActive    | boolean      |                            |
+-------------+--------------+----------------------------+
```

基本实体由列和关系组成。
每个实体**必须**有一个主列（如果使用 MongoDB，则为 ObjectId 列）。

每个实体都必须在连接选项中注册：

```typescript
import { createConnection, Connection } from "typeorm";
import { User } from "./entity/User";

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

或者你可以指定包含所有实体的整个目录， 该目录下所有实体都将被加载：

```typescript
import { createConnection, Connection } from "typeorm";

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

如果要为`User`实体使用替代表名，可以在`@ Entity`中指定：`@Entity（“my_users”）`。
如果要为应用程序中的所有数据库表设置基本前缀，可以在连接选项中指定`entityPrefix`。

使用实体构造函数时，其参数**必须是可选的**。 由于 ORM 在从数据库加载时才创建实体类的实例，因此在此之前并不知道构造函数的参数。

在[Decorators reference](decorator-reference.md)中了解有关参数@Entity 的更多信息。

## 实体列

由于数据库表由列组成，因此实体也必须由列组成。
标有`@ Column`的每个实体类属性都将映射到数据库表列。

### 主列

每个实体必须至少有一个主列。
有几种类型的主要列：

-   `@PrimaryColumn()` 创建一个主列，它可以获取任何类型的任何值。你也可以指定列类型。 如果未指定列类型，则将从属性类型自动推断。

下面的示例将使用`int`类型创建 id，你必须在保存之前手动分配。

```typescript
import { Entity, PrimaryColumn } from "typeorm";

@Entity()
export class User {
    @PrimaryColumn()
    id: number;
}
```

-   `@PrimaryGeneratedColumn()` 创建一个主列，该值将使用自动增量值自动生成。 它将使用`auto-increment` /`serial` /`sequence`创建`int`列（取决于数据库）。 你不必在保存之前手动分配其值，该值将会自动生成。

```typescript
import { Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;
}
```

-   `@PrimaryGeneratedColumn("uuid")` 创建一个主列，该值将使用`uuid`自动生成。 Uuid 是一个独特的字符串 id。 你不必在保存之前手动分配其值，该值将自动生成。

```typescript
import { Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class User {
    @PrimaryGeneratedColumn("uuid")
    id: string;
}
```

你也可以拥有复合主列：

```typescript
import { Entity, PrimaryColumn } from "typeorm";

@Entity()
export class User {
    @PrimaryColumn()
    firstName: string;

    @PrimaryColumn()
    lastName: string;
}
```

当您使用`save`保存实体时，它总是先尝试使用给定的实体 ID（或 ids）在数据库中查找实体。
如果找到 id / ids，则将更新数据库中的这一行。
如果没有包含 id / ids 的行，则会插入一个新行。

要通过 id 查找实体，可以使用`manager.findOne`或`repository.findOne`。 例：

```typescript
// 使用单个主键查找一个id
const person = await connection.manager.findOne(Person, 1);
const person = await connection.getRepository(Person).findOne(1);

// 使用复合主键找到一个id
const user = await connection.manager.findOne(User, { firstName: "Timber", lastName: "Saw" });
const user = await connection.getRepository(User).findOne({ firstName: "Timber", lastName: "Saw" });
```

### 特殊列

有几种特殊的列类型可以使用：

-   `@CreateDateColumn` 是一个特殊列，自动为实体插入日期。无需设置此列，该值将自动设置。

-   `@UpdateDateColumn` 是一个特殊列，在每次调用实体管理器或存储库的`save`时，自动更新实体日期。无需设置此列，该值将自动设置。

-   `@VersionColumn` 是一个特殊列，在每次调用实体管理器或存储库的`save`时自动增长实体版本（增量编号）。无需设置此列，该值将自动设置。

### 空间列

MS SQL，MySQL/MariaDB 和 PostgreSQL 都支持 Spatial 列。由于各数据库列名不同，TypeORM 对数据库的支持略有差异。

MS SQL 和 MySQL/MariaDB 的 TypeORM 支持[well-known text(WKT)](https://en.wikipedia.org/wiki/Well-known_text)的 geometries，因此 geometry 列 应该是用`string`类型标记。

TypeORM 的 PostgreSQL 支持使用[GeoJSON](http://geojson.org/)作为交换格式，因此 geometry 列应在导入后标记为`object`或`Geometry`（或子类，例如`Point`）。

TypeORM尝试做正确的事情，但并不总是能够确定何时插入的值或PostGIS函数的结果应被视为几何。 因此，你可能会发现自己编写的代码类似于以下代码，其中值从GeoJSON转换为PostGIS `geometry`,并作为`json`转换为GeoJSON：

```typescript
const origin = {
    type: "Point",
    coordinates: [0, 0]
};

await getManager()
    .createQueryBuilder(Thing, "thing")
    // 将字符串化的GeoJSON转换为具有与表规范匹配的SRID的geometry
    .where("ST_Distance(geom, ST_SetSRID(ST_GeomFromGeoJSON(:origin), ST_SRID(geom))) > 0")
    .orderBy(
        "ST_Distance(geom, ST_SetSRID(ST_GeomFromGeoJSON(:origin), ST_SRID(geom)))",
        "ASC"
    )
    .setParameters({
        // 字符串化 GeoJSON
        origin: JSON.stringify(origin)
    })
    .getMany();

await getManager()
    .createQueryBuilder(Thing, "thing")
    // 将geometry结果转换为GeoJSON，以将此视为JSON（以便TypeORM知道反序列化它）
    .select("ST_AsGeoJSON(ST_Buffer(geom, 0.1))::json geom")
    .from("thing")
    .getMany();
```

## 列类型

TypeORM 支持所有最常用的数据库支持的列类型。
列类型是特定于数据库类型的 - 这为数据库架构提供了更大的灵活性。
你可以将列类型指定为`@ Column`的第一个参数
或者在`@Column`的列选项中指定，例如：

```typescript
@Column("int")
```

或

```typescript
@Column({ type: "int" })
```

如果要指定其他类型参数，可以通过列选项来执行。
例如:

```typescript
@Column("varchar", { length: 200 })
```

或

```typescript
@Column({ type: "int", length: 200 })
```

### `mysql`/`mariadb`的列类型

`int`, `tinyint`, `smallint`, `mediumint`, `bigint`, `float`, `double`, `dec`, `decimal`, `numeric`,
`date`, `datetime`, `timestamp`, `time`, `year`, `char`, `varchar`, `nvarchar`, `text`, `tinytext`,
`mediumtext`, `blob`, `longtext`, `tinyblob`, `mediumblob`, `longblob`, `enum`, `json`, `binary`,
`geometry`, `point`, `linestring`, `polygon`, `multipoint`, `multilinestring`, `multipolygon`,
`geometrycollection`

### `postgres`的列类型

`int`, `int2`, `int4`, `int8`, `smallint`, `integer`, `bigint`, `decimal`, `numeric`, `real`,
`float`, `float4`, `float8`, `double precision`, `money`, `character varying`, `varchar`,
`character`, `char`, `text`, `citext`, `hstore`, `bytea`, `bit`, `varbit`, `bit varying`,
`timetz`, `timestamptz`, `timestamp`, `timestamp without time zone`, `timestamp with time zone`,
`date`, `time`, `time without time zone`, `time with time zone`, `interval`, `bool`, `boolean`,
`enum`, `point`, `line`, `lseg`, `box`, `path`, `polygon`, `circle`, `cidr`, `inet`, `macaddr`,
`tsvector`, `tsquery`, `uuid`, `xml`, `json`, `jsonb`, `int4range`, `int8range`, `numrange`,
`tsrange`, `tstzrange`, `daterange`, `int4multirange`, `int8multirange`, `nummultirange`,
`tsmultirange`, `tstzmultirange`, `multidaterange`, `geometry`, `geography`, `vector`

### `sqlite`/`cordova`/`react-native`/`expo`的列类型

`int`, `int2`, `int8`, `integer`, `tinyint`, `smallint`, `mediumint`, `bigint`, `decimal`,
`numeric`, `float`, `double`, `real`, `double precision`, `datetime`, `varying character`,
`character`, `native character`, `varchar`, `nchar`, `nvarchar2`, `unsigned big int`, `boolean`,
`blob`, `text`, `clob`, `date`

### `mssql`的列类型

`int`, `bigint`, `bit`, `decimal`, `money`, `numeric`, `smallint`, `smallmoney`, `tinyint`, `float`,
`real`, `date`, `datetime2`, `datetime`, `datetimeoffset`, `smalldatetime`, `time`, `char`, `varchar`,
`text`, `nchar`, `nvarchar`, `ntext`, `binary`, `image`, `varbinary`, `hierarchyid`, `sql_variant`,
`timestamp`, `uniqueidentifier`, `xml`, `geometry`, `geography`, `rowversion`

### `oracle`的列类型

`char`, `nchar`, `nvarchar2`, `varchar2`, `long`, `raw`, `long raw`, `number`, `numeric`, `float`, `dec`,
`decimal`, `integer`, `int`, `smallint`, `real`, `double precision`, `date`, `timestamp`, `timestamp with time zone`,
`timestamp with local time zone`, `interval year to month`, `interval day to second`, `bfile`, `blob`, `clob`,
`nclob`, `rowid`, `urowid`

### `enum` 列类型

`postgres`和`mysql`都支持`enum`列类型。 并有多种列定义方式：

使用typescript枚举：

```typescript
export enum UserRole {
    ADMIN = "admin",
    EDITOR = "editor",
    GHOST = "ghost"
}

@Entity()
export class User {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        type: "enum",
        enum: UserRole,
        default: UserRole.GHOST
    })
    role: UserRole

}
```

> 注意：支持字符串，数字和异构枚举。

使用带枚举值的数组：

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

### `simple-array`的列类型

有一种称为`simple-array`的特殊列类型，它可以将原始数组值存储在单个字符串列中。
所有值都以逗号分隔。 例如：

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
user.names = ["Alexander", "Alex", "Sasha", "Shurik"];
```

存储在单个数据库列中的`Alexander，Alex，Sasha，Shurik`值。
当你从数据库加载数据时，name 将作为 names 数组返回，就像之前存储它们一样。

注意**不能**在值里面有任何逗号。

### `simple-json` 列类型

还有一个名为`simple-json`的特殊列类型，它可以存储任何可以通过 JSON.stringify 存储在数据库中的值。
当你的数据库中没有 json 类型而你又想存储和加载对象，该类型就很有用了。
例如:

```typescript
@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column("simple-json")
    profile: { name: string; nickname: string };
}
```

```typescript
const user = new User();
user.profile = { name: "John", nickname: "Malkovich" };
```

存储在单个数据库列中的`{“name”：“John”，“nickname”：“Malkovich”}`值
当你从数据库加载数据时，将通过 JSON.parse 返回 object/array/primitive。

### 具有生成值的列

你可以使用`@Generated`装饰器创建具有生成值的列。 例如：

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

`uuid`值将自动生成并存储到数据库中。

除了"uuid"之外，还有"increment"生成类型，但是对于这种类型的生成，某些数据库平台存在一些限制（例如，某些数据库只能有一个增量列，或者其中一些需要增量才能成为主键）。

## 列选项

列选项定义实体列的其他选项。
你可以在`@ Column`上指定列选项：

```typescript
@Column({
    type: "varchar",
    length: 150,
    unique: true,
    // ...
})
name: string;
```

`ColumnOptions`中可用选项列表：

-   `type: ColumnType` - 列类型。其中之一在[上面](#column-types).
-   `name: string` - 数据库表中的列名。

默认情况下，列名称是从属性的名称生成的。
你也可以通过指定自己的名称来更改它。

-   `length: number` - 列类型的长度。 例如，如果要创建`varchar（150）`类型，请指定列类型和长度选项。
-   `width: number` - 列类型的显示范围。 仅用于[MySQL integer types](https://dev.mysql.com/doc/refman/5.7/en/integer-types.html)
-   `onUpdate: string` - `ON UPDATE`触发器。 仅用于 [MySQL](https://dev.mysql.com/doc/refman/5.7/en/timestamp-initialization.html).
-   `nullable: boolean` - 在数据库中使列`NULL`或`NOT NULL`。 默认情况下，列是`nullable：false`。
-   `update: boolean` - 指示"save"操作是否更新列值。如果为false，则只能在第一次插入对象时编写该值。
    默认值为"true"。
-   `select: boolean` - 定义在进行查询时是否默认隐藏此列。 设置为`false`时，列数据不会显示标准查询。 默认情况下，列是`select：true`
-   `default: string` - 添加数据库级列的`DEFAULT`值。
-   `primary: boolean` - 将列标记为主要列。 使用方式和`@ PrimaryColumn`相同。
-   `unique: boolean` - 将列标记为唯一列（创建唯一约束）。
-   `comment: string` - 数据库列备注，并非所有数据库类型都支持。
-   `precision: number` - 十进制（精确数字）列的精度（仅适用于十进制列），这是为值存储的最大位数。仅用于某些列类型。
-   `scale: number` - 十进制（精确数字）列的比例（仅适用于十进制列），表示小数点右侧的位数，且不得大于精度。 仅用于某些列类型。
-   `zerofill: boolean` - 将`ZEROFILL`属性设置为数字列。 仅在 MySQL 中使用。 如果是`true`，MySQL 会自动将`UNSIGNED`属性添加到此列。
-   `unsigned: boolean` - 将`UNSIGNED`属性设置为数字列。 仅在 MySQL 中使用。
-   `charset: string` - 定义列字符集。 并非所有数据库类型都支持。
-   `collation: string` - 定义列排序规则。
-   `enum: string[]|AnyEnum` - 在`enum`列类型中使用，以指定允许的枚举值列表。 你也可以指定数组或指定枚举类。
-   `asExpression: string` - 生成的列表达式。 仅在[MySQL](https://dev.mysql.com/doc/refman/5.7/en/create-table-generated-columns.html)中使用。
-   `generatedType: "VIRTUAL"|"STORED"` - 生成的列类型。 仅在[MySQL](https://dev.mysql.com/doc/refman/5.7/en/create-table-generated-columns.html)中使用。
-   `hstoreType: "object"|"string"` -返回`HSTORE`列类型。 以字符串或对象的形式返回值。 仅在[Postgres](<(https://www.postgresql.org/docs/9.6/static/hstore.html)>)中使用。
-   `array: boolean` - 用于可以是数组的 postgres 列类型（例如 int []）
-   `transformer: { from(value: DatabaseType): EntityType, to(value: EntityType): DatabaseType }` - 用于将任意类型`EntityType`的属性编组为数据库支持的类型`DatabaseType`。

注意：大多数列选项都是特定于 RDBMS 的，并且在`MongoDB`中不可用。

## 实体继承

你可以使用实体继承减少代码中的重复。

例如，你有`Photo`, `Question`, `Post` 三个实体:

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

正如你所看到的，所有这些实体都有共同的列：`id`，`title`，`description`。 为了减少重复并产生更好的抽象，我们可以为它们创建一个名为`Content`的基类：

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

来自父实体的所有列（relations，embeds 等）（父级也可以扩展其他实体）将在最终实体中继承和创建。

## 树实体

TypeORM 支持存储树结构的 Adjacency 列表和 Closure 表模式。

### 邻接列表

邻接列表是一个具有自引用的简单模型。
这种方法的好处是简单，缺点是你不能因为连接限制而立刻加载一个树实体。

例如:

```typescript
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany } from "typeorm";

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

### Closure 表

closure 表以特殊方式在单独的表中存储父和子之间的关系。
它在读写方面都很有效。

要了解有关 closure 表的更多信息，请查看 [this awesome presentation by Bill Karwin](https://www.slideshare.net/billkarwin/models-for-hierarchical-data).

例如:

```typescript
import { Entity, Tree, Column, PrimaryGeneratedColumn, TreeChildren, TreeParent, TreeLevelColumn } from "typeorm";

@Entity()
@Tree("closure-table")
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
