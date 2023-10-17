# Multiple data sources, databases, schemas and replication setup

-   [Using multiple data sources](#using-multiple-data-sources)
-   [Using multiple databases in a single data source](#using-multiple-databases-within-a-single-data-source)
-   [Using multiple schemas in a single data source](#using-multiple-schemas-within-a-single-data-source)
-   [Replication](#replication)

## Using multiple data sources

To use multiple data sources connected to different databases, simply create multiple DataSource instances:

```typescript
import { DataSource } from "typeorm"

const db1DataSource = new DataSource({
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "root",
    password: "admin",
    database: "db1",
    entities: [__dirname + "/entity/*{.js,.ts}"],
    synchronize: true,
})

const db2DataSource = new DataSource({
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "root",
    password: "admin",
    database: "db2",
    entities: [__dirname + "/entity/*{.js,.ts}"],
    synchronize: true,
})
```

## Using multiple databases within a single data source

To use multiple databases in a single data source,
you can specify database name per-entity:

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from "typeorm"

@Entity({ database: "secondDB" })
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    firstName: string

    @Column()
    lastName: string
}
```

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from "typeorm"

@Entity({ database: "thirdDB" })
export class Photo {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    url: string
}
```

`User` entity will be created inside `secondDB` database and `Photo` entity inside `thirdDB` database.
All other entities will be created in a default database defined in the data source options.

If you want to select data from a different database you only need to provide an entity:

```typescript
const users = await dataSource
    .createQueryBuilder()
    .select()
    .from(User, "user")
    .addFrom(Photo, "photo")
    .andWhere("photo.userId = user.id")
    .getMany() // userId is not a foreign key since its cross-database request
```

This code will produce following SQL query (depend on database type):

```sql
SELECT * FROM "secondDB"."user" "user", "thirdDB"."photo" "photo"
    WHERE "photo"."userId" = "user"."id"
```

You can also specify a table path instead of the entity:

```typescript
const users = await dataSource
    .createQueryBuilder()
    .select()
    .from("secondDB.user", "user")
    .addFrom("thirdDB.photo", "photo")
    .andWhere("photo.userId = user.id")
    .getMany() // userId is not a foreign key since its cross-database request
```

This feature is supported only in mysql and mssql databases.

## Using multiple schemas within a single data source

To use multiple schemas in your applications, just set `schema` on each entity:

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from "typeorm"

@Entity({ schema: "secondSchema" })
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    firstName: string

    @Column()
    lastName: string
}
```

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from "typeorm"

@Entity({ schema: "thirdSchema" })
export class Photo {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    url: string
}
```

`User` entity will be created inside `secondSchema` schema and `Photo` entity inside `thirdSchema` schema.
All other entities will be created in a default database defined in the data source options.

If you want to select data from a different schema you only need to provide an entity:

```typescript
const users = await dataSource
    .createQueryBuilder()
    .select()
    .from(User, "user")
    .addFrom(Photo, "photo")
    .andWhere("photo.userId = user.id")
    .getMany() // userId is not a foreign key since its cross-database request
```

This code will produce following SQL query (depend on database type):

```sql
SELECT * FROM "secondSchema"."question" "question", "thirdSchema"."photo" "photo"
    WHERE "photo"."userId" = "user"."id"
```

You can also specify a table path instead of entity:

```typescript
const users = await dataSource
    .createQueryBuilder()
    .select()
    .from("secondSchema.user", "user") // in mssql you can even specify a database: secondDB.secondSchema.user
    .addFrom("thirdSchema.photo", "photo") // in mssql you can even specify a database: thirdDB.thirdSchema.photo
    .andWhere("photo.userId = user.id")
    .getMany()
```

This feature is supported only in postgres and mssql databases.
In mssql you can also combine schemas and databases, for example:

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from "typeorm"

@Entity({ database: "secondDB", schema: "public" })
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    firstName: string

    @Column()
    lastName: string
}
```

## Replication

You can set up read/write replication using TypeORM.
Example of replication options:

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

All schema update and write operations are performed using `master` server.
All simple queries performed by find methods or select query builder are using a random `slave` instance.
All queries performed by query method are performed using the `master` instance.

If you want to explicitly use master in SELECT created by query builder, you can use the following code:

```typescript
const masterQueryRunner = dataSource.createQueryRunner("master")
try {
    const postsFromMaster = await dataSource
        .createQueryBuilder(Post, "post", masterQueryRunner) // you can either pass QueryRunner as an optional argument with query builder
        .setQueryRunner(masterQueryRunner) // or use setQueryRunner which sets or overrides query builder's QueryRunner
        .getMany()
} finally {
    await masterQueryRunner.release()
}
```

If you want to use `slave` in raw queries, you also need to explicitly specify the query runner.

```typescript
const slaveQueryRunner = dataSource.createQueryRunner("slave")
try {
    const userFromSlave = await slaveQueryRunner.query(
        "SELECT * FROM users WHERE id = $1",
        [userId],
        slaveQueryRunner,
    )
} finally {
    return slaveQueryRunner.release()
}
```

Note that connection created by a `QueryRunner` need to be explicitly released.

Replication is supported by mysql, postgres and sql server databases.

Mysql supports deep configuration:

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
    * If true, PoolCluster will attempt to reconnect when connection fails. (Default: true)
    */
    canRetry: true,

    /**
     * If connection fails, node's errorCount increases.
     * When errorCount is greater than removeNodeErrorCount, remove a node in the PoolCluster. (Default: 5)
     */
    removeNodeErrorCount: 5,

    /**
     * If connection fails, specifies the number of milliseconds before another connection attempt will be made.
     * If set to 0, then node will be removed instead and never re-used. (Default: 0)
     */
     restoreNodeTimeout: 0,

    /**
     * Determines how slaves are selected:
     * RR: Select one alternately (Round-Robin).
     * RANDOM: Select the node by random function.
     * ORDER: Select the first node available unconditionally.
     */
    selector: "RR"
  }
}
```
