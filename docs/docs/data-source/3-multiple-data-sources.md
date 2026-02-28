# Multiple data sources, databases, schemas and replication setup

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
    entities: [__dirname + "/entities/*{.js,.ts}"],
    synchronize: true,
})

const db2DataSource = new DataSource({
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "root",
    password: "admin",
    database: "db2",
    entities: [__dirname + "/entities/*{.js,.ts}"],
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
const datasource = new DataSource({
    type: "mysql",
    logging: true,
    replication: {
        primary: {
            host: "server1",
            port: 3306,
            username: "test",
            password: "test",
            database: "test",
        },
        replicas: [
            {
                host: "server2",
                port: 3306,
                username: "test",
                password: "test",
                database: "test",
            },
            {
                host: "server3",
                port: 3306,
                username: "test",
                password: "test",
                database: "test",
            },
        ],
    },
})
```

With replication replicas defined, TypeORM will start sending all possible queries to replicas by default.

- all queries performed by the `find` methods or `SelectQueryBuilder` will use a random `replica` instance
- all write queries performed by `update`, `create`, `InsertQueryBuilder`, `UpdateQueryBuilder`, etc will use the `primary` instance
- all raw queries performed by calling `.query()` will use the `primary` instance
- all schema update operations are performed using the `primary` instance

TypeORM also supports legacy `master`/`slaves` keys and `"master"`/`"slave"` replication modes for backward compatibility.
If both naming styles are provided in the same config, legacy `master`/`slaves` values are used when they are equivalent; conflicting values throw at startup to avoid ambiguous routing.

### Explicitly selecting query destinations

By default, TypeORM will send all read queries to a random read replica, and all writes to the primary. This means when you first add the `replication` settings to your configuration, any existing read query runners that don't explicitly specify a replication mode will start going to a replica. This is good for scalability, but if some of those queries _must_ return up to date data, then you need to explicitly pass a replication mode when you create a query runner.

If you want to explicitly use the `primary` for read queries, pass an explicit `ReplicationMode` when creating your `QueryRunner`;

```typescript
const primaryQueryRunner = dataSource.createQueryRunner("primary")
try {
    const postsFromPrimary = await dataSource
        .createQueryBuilder(Post, "post", primaryQueryRunner) // you can either pass QueryRunner as an optional argument with query builder
        .setQueryRunner(primaryQueryRunner) // or use setQueryRunner which sets or overrides query builder's QueryRunner
        .getMany()
} finally {
    await primaryQueryRunner.release()
}
```

If you want to use a replica in raw queries, pass `replica` as the replication mode when creating a query runner:

```typescript
const replicaQueryRunner = dataSource.createQueryRunner("replica")
try {
    const userFromReplica = await replicaQueryRunner.query(
        "SELECT * FROM users WHERE id = $1",
        [userId],
    )
} finally {
    await replicaQueryRunner.release()
}
```

**Note**: Manually created `QueryRunner` instances must be explicitly released on their own. If you don't release your query runners, they will keep a connection checked out of the pool, and prevent other queries from using it.

### Adjusting the default destination for reads

If you don't want all reads to go to a `replica` instance by default, you can change the default read query destination by passing `defaultMode: "primary"` in your replication options:

```typescript
const datasource = new DataSource({
    type: "mysql",
    logging: true,
    replication: {
        // set the default destination for read queries as the primary instance
        defaultMode: "primary",
        primary: {
            host: "server1",
            port: 3306,
            username: "test",
            password: "test",
            database: "test",
        },
        replicas: [
            {
                host: "server2",
                port: 3306,
                username: "test",
                password: "test",
                database: "test",
            },
        ],
    },
})
```

With this mode, no queries will go to read replicas by default, and you'll have to opt-in to sending queries to replicas with explicit `.createQueryRunner("replica")` calls.

If you're adding replication options to an existing app for the first time, this is a good option for ensuring no behavior changes right away, and instead you can slowly adopt read replicas on a query runner by query runner basis.

### Supported drivers

Replication is supported by the MySQL, PostgreSQL, SQL Server, Cockroach, Oracle, and Spanner connection drivers.

MySQL replication supports extra configuration options:

```typescript
{
  replication: {
    primary: {
      host: "server1",
      port: 3306,
      username: "test",
      password: "test",
      database: "test"
    },
    replicas: [{
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
     * Determines how replicas are selected:
     * RR: Select one alternately (Round-Robin).
     * RANDOM: Select the node by random function.
     * ORDER: Select the first node available unconditionally.
     */
    selector: "RR"
  }
}
```
