# 多个连接，数据库，模式和主从复制设置

* [使用多个连接](#使用多个连接)
* [在单个连接中使用多个数据库](#在单个连接中使用多个数据库)
* [在单个连接中使用多个模式](#在单个连接中使用多个模式)
* [主从复制](#主从复制)


## 使用多个连接

使用多个数据库的最简单方法是创建不同的连接：

```typescript
import {createConnections} from "typeorm";

const connections = await createConnections([{
    name: "db1Connection",
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "root",
    password: "admin",
    database: "db1",
    entities: [__dirname + "/entity/*{.js,.ts}"],
    synchronize: true
}, {
    name: "db2Connection",
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "root",
    password: "admin",
    database: "db2",
    entities: [__dirname + "/entity/*{.js,.ts}"],
    synchronize: true
}]);
```

此方法允许你连接到已拥有的任意数量的数据库，每个数据库都有自己的配置，自己的实体和整体ORM范围和设置。

对于每个连接，将创建一个新的`Connection`实例。
你必须为创建的每个连接指定唯一的名称。

也可以从ormconfig文件加载所有连接选项：

```typescript
import {createConnections} from "typeorm";

const connections = await createConnections();
```

指定要按名称创建的连接：

```typescript
import {createConnection} from "typeorm";

const connection = await createConnection("db2Connection");
```

使用连接时，必须指定连接名称以获取特定连接：

```typescript
import {getConnection} from "typeorm";

const db1Connection = getConnection("db1Connection");
// 现在可以使用"db1"数据库...

const db2Connection = getConnection("db2Connection");
// 现在可以使用"db2"数据库...
```

使用此方法的好处是你可以使用不同的登录凭据，主机，端口甚至数据库类型来配置多个连接。

但是缺点可能是需要管理和使用多个连接实例。

## 在单个连接中使用多个数据库

如果你不想创建多个连接，但是想在一个连接中使用多个数据库，则可以指定使用的每个实体的数据库名称：

```typescript
import {Entity, PrimaryGeneratedColumn, Column} from "typeorm";

@Entity({ database: "secondDB" })
export class User {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

}
```

```typescript
import {Entity, PrimaryGeneratedColumn, Column} from "typeorm";

@Entity({ database: "thirdDB" })
export class Photo {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    url: string;

}
```
`user`实体将在`secondDB`数据库内创建，`Photo`实体则在`thirdDB`数据库内。

如果要从其他数据库中选择数据，则只需提供一个实体：

```typescript
const users = await connection
    .createQueryBuilder()
    .select()
    .from(User, "user")
    .addFrom(Photo, "photo")
    .andWhere("photo.userId = user.id")
    .getMany(); // userId因其跨数据库请求而不是外键
```

此代码将生成以下sql查询（取决于数据库类型）：

```sql
SELECT * FROM "secondDB"."question" "question", "thirdDB"."photo" "photo" 
    WHERE "photo"."userId" = "user"."id"
```

还可以指定表而不是实体：

```typescript
const users = await connection
    .createQueryBuilder()
    .select()
    .from("secondDB.user", "user")
    .addFrom("thirdDB.photo", "photo")
    .andWhere("photo.userId = user.id")
    .getMany(); // userId因其跨数据库请求而不是外键
```

仅在mysql和mssql数据库中支持此功能。

## 在单个连接中使用多个模式

你可以在应用程序中使用多个模式，只需在每个实体上设置`schema`：

```typescript
import {Entity, PrimaryGeneratedColumn, Column} from "typeorm";

@Entity({ schema: "secondSchema" })
export class User {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

}
```

```typescript
import {Entity, PrimaryGeneratedColumn, Column} from "typeorm";

@Entity({ schema: "thirdSchema" })
export class Photo {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    url: string;

}
```
`user`实体将在`secondSchema` schema中创建，`photo`实体将在`thirdSchema` schema中创建。

其他实体将在默认连接架构中创建。

如果要从其他模式中选择数据，则只需提供一个实体：

```typescript
const users = await connection
    .createQueryBuilder()
    .select()
    .from(User, "user")
    .addFrom(Photo, "photo")
    .andWhere("photo.userId = user.id")
    .getMany(); // userId因其跨数据库请求而不是外键
```

此代码将生成以下sql查询（取决于数据库类型）：

```sql
SELECT * FROM "secondSchema"."question" "question", "thirdSchema"."photo" "photo" 
    WHERE "photo"."userId" = "user"."id"
```

你还可以指定表而不是实体：

```typescript
const users = await connection
    .createQueryBuilder()
    .select()
    .from("secondSchema.user", "user") // 在mssql中，指定数据库：secondDB.secondSchema.user
    .addFrom("thirdSchema.photo", "photo") // 在mssql中，指定数据库：thirdDB.thirdSchema.photo
    .andWhere("photo.userId = user.id")
    .getMany();
```

仅在postgres和mssql数据库中支持此功能。

在mssql中，你还可以组合模式和数据库，例如：

```typescript
import {Entity, PrimaryGeneratedColumn, Column} from "typeorm";

@Entity({ database: "secondDB", schema: "public" })
export class User {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

}
```

## 主从复制

你可以使用TypeORM设置读/写复制。

复制连接设置示例：

```typescript
{
  type: "mysql",
  logging: true,
  replication: {
    master: {
      host: "server1",
      port: 3306,
      username: "test",
      password: "test",
      database: "test"
    },
    slaves: [{
      host: "server2",
      port: 3306,
      username: "test",
      password: "test",
      database: "test"
    }, {
      host: "server3",
      port: 3306,
      username: "test",
      password: "test",
      database: "test"
    }]
  }
}
```

所有模式更新和写入操作都使用`master`服务器执行。
find方法或select query builder执行的所有简单查询都使用随机的`slave`实例。

如果要在查询构建器创建的SELECT中显式使用master，可以使用以下代码：

```typescript
const masterQueryRunner = connection.createQueryRunner("master");
try {
    const postsFromMaster = await connection.createQueryBuilder(Post, "post")
        .setQueryRunner(masterQueryRunner)
        .getMany();
} finally {
      await masterQueryRunner.release();
}
```
请注意，需要显式释放由`QueryRunner`创建的连接。

mysql，postgres和sql server数据库都支持复制。

Mysql支持深度配置：

```typescript
{
  replication: {
    master: {
      host: "server1",
      port: 3306,
      username: "test",
      password: "test",
      database: "test"
    },
    slaves: [{
      host: "server2",
      port: 3306,
      username: "test",
      password: "test",
      database: "test"
    }, {
      host: "server3",
      port: 3306,
      username: "test",
      password: "test",
      database: "test"
    }],
    
    /**
    * 如果为true，则PoolCluster将在连接失败时尝试重新连接。 （默认值：true）
    */
    canRetry: true,

    /**
     * 如果连接失败，则节点的errorCount会增加。
     * 当errorCount大于removeNodeErrorCount时，删除PoolCluster中的节点。 （默认值：5）
     */
    removeNodeErrorCount: 5,

    /**
     * 如果连接失败，则指定在进行另一次连接尝试之前的毫秒数。
     * 如果设置为0，则将删除节点，并且永远不会重复使用。 （默认值：0）
     */
     restoreNodeTimeout: 0,

    /**
     * 确定如何选择从库：
     * RR：交替选择一个（Round-Robin）。
     * RANDOM: 通过随机函数选择节点。
     * ORDER: 无条件选择第一个
     */
    selector: "RR"
  }
}
```
