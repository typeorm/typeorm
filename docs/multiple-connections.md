# Multiple connections, databases, schemas and replication setup

* [Using multiple connections](#using-multiple-connections)
* [Using multiple databases in a single connection](#using-multiple-databases-in-a-single-connection)
* [Using multiple schemas in a single connection](#using-multiple-schemas-in-a-single-connection)
* [Replication](#replication)


## Using multiple connections

The simplest way to use multiple databases is to create different connections:

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

This approach allows you to connect to any number of databases you have 
and each database will have its own configuration, own entities and overall ORM scope and settings.

For each connection a new `Connection` instance will be created.
You must specify a unique name for each connection you create.

The connection options can also be loaded from an ormconfig file. You can load all connections from
the ormconfig file:
```typescript
import {createConnections} from "typeorm";

const connections = await createConnections();
```

or you can specify which connection to create by name:
```typescript
import {createConnection} from "typeorm";

const connection = await createConnection("db2Connection");
```

When working with connections you must specify a connection name to get a specific connection:

```typescript
import {getConnection} from "typeorm";

const db1Connection = getConnection("db1Connection");
// you can work with "db1" database now...

const db2Connection = getConnection("db2Connection");
// you can work with "db2" database now...
```

Benefit of using this approach is that you can configure multiple connections with different login credentials,
host, port and even database type itself.
Downside for might be that you'll need to manage and work with multiple connection instances. 

## Using multiple databases in a single connection

If you don't want to create multiple connections, 
but want to use multiple databases in a single database,
you can specify database name per-entity you use:

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

`User` entity will be created inside `secondDB` database and `Photo` entity inside `thirdDB` database.
All other entities will be created in default connection database.

If you want to select data from a different database you only need to provide an entity:

```typescript
const users = await connection
    .createQueryBuilder()
    .select()
    .from(User, "user")
    .addFrom(Photo, "photo")
    .andWhere("photo.userId = user.id")
    .getMany(); // userId is not a foreign key since its cross-database request
```

This code will produce following sql query (depend on database type):

```sql
SELECT * FROM "secondDB"."question" "question", "thirdDB"."photo" "photo" 
    WHERE "photo"."userId" = "user"."id"
```

You can also specify a table path instead of the entity:

```typescript
const users = await connection
    .createQueryBuilder()
    .select()
    .from("secondDB.user", "user")
    .addFrom("thirdDB.photo", "photo")
    .andWhere("photo.userId = user.id")
    .getMany(); // userId is not a foreign key since its cross-database request
```

This feature is supported only in mysql and mssql databases.

## Using multiple schemas in a single connection

You can use multiple schemas in your applications, just set `schema` on each entity:

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

`User` entity will be created inside `secondSchema` schema and `Photo` entity inside `thirdSchema` schema.
All other entities will be created in default connection schema.

If you want to select data from a different schema you only need to provide an entity:

```typescript
const users = await connection
    .createQueryBuilder()
    .select()
    .from(User, "user")
    .addFrom(Photo, "photo")
    .andWhere("photo.userId = user.id")
    .getMany(); // userId is not a foreign key since its cross-database request
```

This code will produce following sql query (depend on database type):

```sql
SELECT * FROM "secondSchema"."question" "question", "thirdSchema"."photo" "photo" 
    WHERE "photo"."userId" = "user"."id"
```

You can also specify a table path instead of the entity:

```typescript
const users = await connection
    .createQueryBuilder()
    .select()
    .from("secondSchema.user", "user") // in mssql you can even specify a database: secondDB.secondSchema.user
    .addFrom("thirdSchema.photo", "photo") // in mssql you can even specify a database: thirdDB.thirdSchema.photo
    .andWhere("photo.userId = user.id")
    .getMany();
```

This feature is supported only in postgres and mssql databases.
In mssql you can also combine schemas and databases, for example:

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

## Replication

You can setup read/write replication using TypeORM.
Example of replication connection settings:

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

If you want to explicitly use master in SELECT created by query builder, you can use following code:

```typescript
const postsFromMaster = await connection.createQueryBuilder(Post, "post")
    .setQueryRunner(connection.createQueryRunner("master"))
    .getMany();
```

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
