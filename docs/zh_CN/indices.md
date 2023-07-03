# 索引

  * [单列索引](#单列索引)
  * [唯一索引](#唯一索引)
  * [联合索引](#联合索引)
  * [空间索引](#空间索引)
  * [禁用同步](#禁用同步)

## 单列索引

你可以在要创建索引的列上使用`@Index`为特定列创建数据库索引。
也可以为实体的任何列创建索引。
例如：

```typescript
import { Entity, PrimaryGeneratedColumn, Column, Index } from "typeorm";

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  firstName: string;

  @Column()
  @Index()
  lastName: string;
}
```

还可以指定索引名称：

```typescript
import { Entity, PrimaryGeneratedColumn, Column, Index } from "typeorm";

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Index("name1-idx")
  @Column()
  firstName: string;

  @Column()
  @Index("name2-idx")
  lastName: string;
}
```

## 唯一索引

要创建唯一索引，需要在索引选项中指定`{unique：true}`：

```typescript
import { Entity, PrimaryGeneratedColumn, Column, Index } from "typeorm";

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column()
  firstName: string;

  @Column()
  @Index({ unique: true })
  lastName: string;
}
```

## 联合索引

要创建具有多个列的索引，需要将`@Index`放在实体本身上，并指定应包含在索引中的所有列属性名称。
例如：

```typescript
import { Entity, PrimaryGeneratedColumn, Column, Index } from "typeorm";

@Entity()
@Index(["firstName", "lastName"])
@Index(["firstName", "middleName", "lastName"], { unique: true })
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstName: string;

  @Column()
  middleName: string;

  @Column()
  lastName: string;
}
```

## 空间索引

MySQL 和 PostgreSQL（当 PostGIS 可用时）都支持空间索引。

要在 MySQL 中的列上创建空间索引，请在使用空间类型的列（`geometry`，`point`，`linestring`，`polygon`，`multipoint`，`multilinestring`，`multipolygon`，`geometrycollection`）上添加`index`，其中`spatial：true`）：

```typescript
@Entity()
export class Thing {
  @Column("point")
  @Index({ spatial: true })
  point: string;
}
```

要在 PostgreSQL 中的列上创建空间索引，请在使用空间类型（`geometry`，`geography`）的列上添加带有`spatial：true`的`Index`：

```typescript
@Entity()
export class Thing {
  @Column("geometry", {
    spatialFeatureType: "Point",
    srid: 4326
  })
  @Index({ spatial: true })
  point: Geometry;
}
```

## 禁用同步

TypeORM 不支持某些索引选项和定义（例如`lower`，`pg_trgm`），因为它们具有许多不同的数据库细节以及获取有关现有数据库索引的信息并自动同步的多个问题。 在这种情况下，你应该使用所需的任何索引签名手动创建索引（例如在迁移中）。 要使 TypeORM 在同步期间忽略这些索引，请在`@Index`装饰器上使用`synchronize：false`选项。

例如，使用不区分大小写的比较创建索引：

```sql
CREATE INDEX "POST_NAME_INDEX" ON "post" (lower("name"))
```

之后，应该禁用此索引的同步，以避免在下一个架构同步时删除：

```ts
@Entity()
@Index("POST_NAME_INDEX", { synchronize: false })
export class Post {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;
}
```
