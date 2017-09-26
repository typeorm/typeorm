# Using multiple databases and schemas

* [Using multiple connections](#using-multiple-connections)
* [Using multiple databases in a single connection](#using-multiple-databases-in-a-single-connection)
* [Using multiple schemas in a single connection](#using-multiple-schemas-in-a-single-connection)


## Using multiple connections

The simplest way to use multiple databases is to create different multiple connections:

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

For each connection new `Connection` instance will be created.
You must specify unique name for each connection you create.

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
Downside may be for you is that you'll need to manage and work with multiple connection instances. 

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

You can also specify a table path instead of entity:

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

You can also specify a table path instead of entity:

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