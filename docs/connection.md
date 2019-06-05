# Working with Connection

* [What is `Connection`](#what-is-connection)
* [Creating a new connection](#creating-a-new-connection)
* [Using `ConnectionManager`](#using-connectionmanager)
* [Working with connection](#working-with-connection)
    
## What is `Connection`

Your interaction with the database is only possible once you setup a connection.
TypeORM's `Connection` does not setup a database connection as it might seem, instead it sets up a connection pool.
If you are interested in a real database connection, then refer to `QueryRunner` documentation.
Each instance of `QueryRunner` is a separate isolated database connection.
Connection pool setup is established once `connect` method of the `Connection` is called.
`connect` method is called automatically if you setup your connection using `createConnection` function.
Disconnection (closing all connections in the pool) is made when `close` is called.
Generally, you must create connection only once in your application bootstrap,
and close it after you completely finished working with the database.
In practice, if you are building a backend for your site and your backend server always stays running -
you never close a connection.

## Creating a new connection

There are several ways how a connection can be created.
The most simple and common way is to use `createConnection` and `createConnections` functions.

`createConnection` creates a single connection:

```typescript
import {createConnection, Connection} from "typeorm";

const connection = await createConnection({
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "test",
    password: "test",
    database: "test"
});
```
A single `url` attribute, plus the `type` attribute, will work too.

```js
createConnection({
    type: 'postgres',
    url: 'postgres://test:test@localhost/test'
})
```

`createConnections` creates multiple connections:

```typescript
import {createConnections, Connection} from "typeorm";

const connections = await createConnections([{
    name: "default",
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "test",
    password: "test",
    database: "test"
}, {
    name: "test2-connection",
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "test",
    password: "test",
    database: "test2"
}]);
```

Both these functions create `Connection` based on connection options you pass and call a `connect` method.
You can create [ormconfig.json](./using-ormconfig.md) file in the root of your project
and connection options will be automatically read from this file by those methods.
Root of your project is the same level where your `node_modules` directory is.

```typescript
import {createConnection, createConnections, Connection} from "typeorm";

// here createConnection will load connection options from
// ormconfig.json / ormconfig.js / ormconfig.yml / ormconfig.env / ormconfig.xml
// files, or from special environment variables
const connection: Connection = await createConnection();

// you can specify the name of the connection to create
// (if you omit name it will create a connection without name specified)
const secondConnection: Connection = await createConnection("test2-connection");

// if createConnections is called instead of createConnection then
// it will initialize and return all connections defined in ormconfig file
const connections: Connection[] = await createConnections();
```

Different connections must have different names.
By default, if connection name is not specified it's equal to `default`.
Usually, you use multiple connections when you use multiple databases or multiple connection configurations.

Once you created a connection you can obtain it anywhere from your app, using `getConnection` function:

```typescript
import {getConnection} from "typeorm";

// can be used once createConnection is called and is resolved
const connection = getConnection();

// if you have multiple connections you can get connection by name
const secondConnection = getConnection("test2-connection");
```

Avoid creating extra classes / services to store and manage your connections.
This functionality is already embedded into TypeORM -
you don't need to overengineer and create useless abstractions.

## Using `ConnectionManager`

You can create connection using `ConnectionManager` class. For example:

```typescript
import {getConnectionManager, ConnectionManager, Connection} from "typeorm";

const connectionManager = getConnectionManager();
const connection = connectionManager.create({
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "test",
    password: "test",
    database: "test",
});
await connection.connect(); // performs connection
```

This is not a general way of creating a connection, but it may be useful for some users.
For example, users who want to create connection and store its instance,
but have to control when the actual "connection" will be established.
Also you can create and maintain your own `ConnectionManager`:

```typescript
import {getConnectionManager, ConnectionManager, Connection} from "typeorm";

const connectionManager = new ConnectionManager();
const connection = connectionManager.create({
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "test",
    password: "test",
    database: "test",
});
await connection.connect(); // performs connection
```

But note, this way you won't be able to use `getConnection()` anymore -
you'll need to store your connection manager instance and use `connectionManager.get` to get a connection you need.

Generally avoid this method and avoid unnecessary complications in your application,
use `ConnectionManager` only if you really think you need it.

## Working with connection

Once you set your connection up, you can use it anywhere in your app using `getConnection` function:

```typescript
import {getConnection} from "typeorm";
import {User} from "../entity/User";

export class UserController {

    @Get("/users")
    getAll() {
        return getConnection().manager.find(User);
    }

}
```

You can also use `ConnectionManager#get` to get a connection,
but using `getConnection()` is enough in most cases.

Using Connection you execute database operations with your entities,
particularly using connection's `EntityManager` and `Repository`.
For more information about them see [Entity Manager and Repository](working-with-entity-manager.md) documentation.

But generally, you don't use `Connection` much.
Most of the time you only create a connection and use `getRepository()` and `getManager()`
to access your connection's manager and repositories without directly using connection object:

```typescript
import {getManager, getRepository} from "typeorm";
import {User} from "../entity/User";

export class UserController {

    @Get("/users")
    getAll() {
        return getManager().find(User);
    }

    @Get("/users/:id")
    getAll(@Param("id") userId: number) {
        return getRepository(User).findOne(userId);
    }

}
```
