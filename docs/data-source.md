# Working with DataSource

-   [What is `DataSource`](#what-is-datasource)
-   [Creating a new DataSource](#creating-a-new-datasource)
-   [Working with DataSource](#working-with-datasource)

## What is `DataSource`

Your interaction with the database is only possible once you setup a DataSource.
TypeORM's `DataSource` holds your database connection settings and
establishes initial database connection or connection pool depend on RDBMS you use.

In order to establish initial connection / connection pool you must call `connect` method of your `DataSource` instance.

Disconnection (closing all connections in the pool) is made when `close` is called.

Generally, you call `connect` method of the `DataSource` instance on application bootstrap,
and `close` it after you completely finished working with the database.
In practice, if you are building a backend for your site and your backend server always stays running -
you never `close` a DataSource.

## Creating a new DataSource

To create a new `DataSource` instance you must initialize its constructor by calling `new DataSource`
and assigning to a global variable that you'll use across your application:

```typescript
import { DataSource } from "typeorm"

const AppDataSource = new DataSource({
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "test",
    password: "test",
    database: "test",
})

MyDataSource.connect()
    .then(() => {
        console.log("Connection established!")
    })
    .catch((err) => {
        console.error("error during connection establishment:", err)
    })
```

`DataSource` accepts `DataSourceOptions` and those options vary depend on database `type` you use.
For different database types there are different options you can specify.

You can define as many data sources as you need in your application, for example:

```typescript
import { DataSource } from "typeorm"

const MysqlDataSource = new DataSource({
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "test",
    password: "test",
    database: "test",
    entities: [
        // ....
    ],
})

const PostgresDataSource = new DataSource({
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: "test",
    password: "test",
    database: "test",
    entities: [
        // ....
    ],
})
```

## Working with DataSource

Once you set your `DataSource`, you can use it anywhere in your app, for example:

```typescript
import { AppDataSource } from "./app-data-source"
import { User } from "../entity/User"

export class UserController {
    @Get("/users")
    getAll() {
        return AppDataSource.manager.find(User)
    }
}
```

Using `DataSource` instance you can execute database operations with your entities,
particularly using `.manager` and `.getRepository()` properties.
For more information about them see [Entity Manager and Repository](working-with-entity-manager.md) documentation.
