# Working with Connection

* [What is `Connection`](#what-is-connection)
* [Creating a new connection](#creating-a-new-connection)
* [Using `ConnectionManager`](#using-connectionmanager)
* [Working with connection](#working-with-connection-1)
    
## What is `Connection`

Connection sets a real connection with your database up.
Depending on the database type it may also setup a connection pool. 
Connection (or connection pool) setup is made when `connect` is called.
Disconnection (or closing all connections in the pool) is made when `close` is called.
Generally, you must create connection only once in your application bootstrap,
and close it after you completely finished working with the database.

## Creating a new connection

There are several ways how a connection can be created. 
The most simple and common way is to use `createConnection` and `createConnections`.

* `createConnection` creates a single connection:

```typescript
import {createConnection, Connection} from "typeorm";

const connection: Connection = await createConnection({
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "test",
    password: "test",
    database: "test"
});
```

* `createConnections` creates multiple connections:

```typescript
import {createConnections, Connection} from "typeorm";

const connections: Connection[] = await createConnections([{
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

Both these methods automatically call `Connection#connect`.

Both these methods automatically load configuration from `ormconfig` file if connection options not specified.
For example:

```typescript
import {createConnection, Connection} from "typeorm";

// here createConnection will load connection options from
// ormconfig.json / ormconfig.js / ormconfig.yml / ormconfig.env / ormconfig.xml
// files, or from special environment variables
// if ormconfig contains multiple connections then it will load connection named "default" 
// or connection without name at all (which means it will be named "default" by default)
const connection: Connection = await createConnection();

// if createConnections is called instead of createConnection then 
// it will initialize and return all connections defined in ormconfig file
```

Different connections must have different names.
By default, if connection name is not specified it's equal to `default`.
Usually, you use multiple connections when you have multiple databases or multiple connection configurations.

Once you created a connection you can obtain it anywhere from your app, using `getConnection`:

```typescript
import {getConnection} from "typeorm";

// can be used once createConnection is called and is resolved
const connection = getConnection();

// if you have multiple connections you can get connection by name:
const secondConnection = getConnection("test2-connection");
```

Avoid creating extra classes / services to store and manager your connections.
This functionality is already embedded into TypeORM - 
you don't need to overengineer and create useless abstractions.

## Using `ConnectionManager`

You can create connection using `ConnectionManager` class. For example:

```typescript
import {getConnectionManager, ConnectionManager, Connection} from "typeorm";

const connectionManager: ConnectionManager = getConnectionManager(); // or you can initialize your own connection manager like this: new ConnectionManager()
const connection: Connection = connectionManager.create({
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "test",
    password: "test",
    database: "test",
});
await connection.connect(); // performs connection
```

This is not the general way of creating a connection, but it may be useful for some users.
For example, users who want to create connection and store its instance, 
but have to control when the actual "connection" will be established.
Also you can create and maintain your own `ConnectionManager`:

```typescript
import {getConnectionManager, ConnectionManager, Connection} from "typeorm";

const connectionManager = new ConnectionManager(); // or you can initialize your own connection manager like this: new ConnectionManager()
const connection: Connection = connectionManager.create({
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

Once you set your connection up, you can use it anywhere in your app using `getConnection`.
For example:

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

Using connection you work with your entities, particularly using `EntityManager` and `Repository`.
For more information about them see [Entity Manager and Repository](working-with-entity-manager.md).

But generally, you don't use `Connection` much. 
Most of the time you only create a connection and use `getRepository()` and `getManager()` to access your connection's manager and repositories without directly using connection object.
For example:

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