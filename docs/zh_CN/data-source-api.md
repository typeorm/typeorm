# Connection API

* [Main API](#main-api)
* [`Connection` API](#connection-api-1)
* [`ConnectionManager` API](#connectionmanager-api)

## Main API

* `createConnection()` - 创建一个新连接并将其注册到全局连接管理器中。
如果省略connection options参数，则从`ormconfig`文件或环境变量中读取连接选项。

```typescript
import {createConnection} from "typeorm";

const connection = await createConnection({
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "test",
    password: "test",
    database: "test"
});
```

* `createConnections()` - 创建多个连接并在全局连接管理器中注册它们。
如果省略connection options参数，则从`ormconfig`文件或环境变量中读取连接选项。

```typescript
import {createConnections} from "typeorm";

const connection = await createConnections([{
    name: "connection1",
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "test",
    password: "test",
    database: "test"
}, {
    name: "connection2",
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "test",
    password: "test",
    database: "test"
}]);
```

* `getConnectionManager()` - 获取存储所有已创建（使用`createConnection()`或`createConnections()`）连接的管理器。

```typescript
import {getConnectionManager} from "typeorm";

const defaultConnection = getConnectionManager().get("default");
const secondaryConnection = getConnectionManager().get("secondary");
```

* `getConnection()` - 获取使用`createConnection`方法创建的连接。

```typescript
import {getConnection} from "typeorm";

const connection = getConnection();
// 如果有命名连接，则可以指定其名称：
const secondaryConnection = getConnection("secondary-connection");
```

* `getEntityManager()` - 获取`EntityManager`。
可以指定连接名称以指示应该采用哪个连接的实体管理器。

```typescript
import {getEntityManager} from "typeorm";

const manager = getEntityManager();
// you can use manager methods now

const secondaryManager = getEntityManager("secondary-connection");
// you can use secondary connection manager methods
```

* `getRepository()` - Gets `Repository` for given entity from connection. 
可以指定连接名称以指示应该采用哪个连接的实体管理器。

```typescript
import {getRepository} from "typeorm";

const userRepository = getRepository(User);
// you can use repository methods now

const blogRepository = getRepository(Blog, "secondary-connection");
// you can use secondary connection repository methods
```

* `getTreeRepository()` - Gets `TreeRepository` for given entity from connection. 
可以指定连接名称以指示应该采用哪个连接的实体管理器。

```typescript
import {getTreeRepository} from "typeorm";

const userRepository = getTreeRepository(User);
// 使用存储库方法

const blogRepository = getTreeRepository(Blog, "secondary-connection");
// 使用另一个存储库方法
```

* `getMongoRepository()` - 获取给定实体的`MongoRepository`。
可以指定连接名称以指示应该采用哪个连接的实体管理器。

```typescript
import {getMongoRepository} from "typeorm";

const userRepository = getMongoRepository(User);
//使用存储库方法

const blogRepository = getMongoRepository(Blog, "secondary-connection");
// 使用另一个存储库方法
```

## `Connection` API

* `name` - 连接名。 如果没有指定连接名，则默认值为`default`。
在处理多个连接时使用此名称并调用`getConnection(connectionName：string)`。

```typescript
const connectionName: string = connection.name;
```

* `options` - 用于创建此连接的连接选项。
了解有关[连接选项](./connection-options.md)的更多信息。

```typescript
const connectionOptions: ConnectionOptions = connection.options;
// 你可以将connectionOptions转换为MysqlConnectionOptions或任何其他xxxConnectionOptions，
// 具体取决于你使用的数据库驱动程序
```

* `isConnected` - 指示是否建立了与数据库的真实连接。

```typescript
const isConnected: boolean = connection.isConnected;
```

* `driver` - 此连接中使用的基础数据库驱动程序。

```typescript
const driver: Driver = connection.driver;
// 你可以根据使用的数据库驱动程序将connectionOptions转换为MysqlDriver或任何其他xxxDriver
```

* `manager` - `EntityManager`用于连接实体。
查看更多关于[实体管理器和存储库](working-with-entity-manager.md).

```typescript
const manager: EntityManager = connection.manager;
// 你可以调用manager方法，例如find：
const user = await manager.findOne(1);
```

* `mongoManager` - `MongoEntityManager`用于处理mongodb连接中的连接实体。
有关MongoEntityManager的更多信息，请参阅[MongoDB](./mongodb.md)文档。

```typescript
const manager: MongoEntityManager = connection.mongoManager;
//你可以调用manager或mongodb-manager特定方法，例如find：
const user = await manager.findOne(1);
```

* `connect` - 执行与数据库的连接。
当你使用`createConnection`时，它会自动调用`connect`，你不需要自己调用它。

```typescript
await connection.connect();
```

* `close` - 关闭与数据库的连接。
通常需要在应用程序关闭时调用此方法。

```typescript
await connection.close();
```

* `synchronize` - 同步数据库架构。 当在连接选项中设置`synchronize：true`时，它会调用此方法。
通常需要在应用程序关闭时调用此方法。

```typescript
await connection.synchronize();
```

* `dropDatabase` - 删除数据库及其所有数据。
请谨慎使用此方法，因为此方法将清除所有数据库表及其数据。
只有在建立与数据库的连接后才能使用。

```typescript
await connection.dropDatabase();
```

* `runMigrations` - 运行所有挂起的迁移。

```typescript
await connection.runMigrations();
```

* `undoLastMigration` - 恢复上次执行的迁移。

```typescript
await connection.undoLastMigration();
```

* `hasMetadata` - 检查是否已注册给定实体的元数据。
了解更多关于 [Entity Metadata](./entity-metadata.md).

```typescript
if (connection.hasMetadata(User))
    const userMetadata = connection.getMetadata(User);
```

* `getMetadata` - 获取给定实体的`EntityMetadata`。
你还可以指定表名，如果找到具有此类表名的实体元数据，则会返回该名称。
了解更多关于 [Entity Metadata](./entity-metadata.md).

```typescript
const userMetadata = connection.getMetadata(User);
// 获得有关用户实体的任何信息
```

* `getRepository` - 获取给定实体的`Repository`。
你还可以指定表名，如果找到给定表的存储库，则会返回该表。
了解更多关于 [Repositories](working-with-repository.md)。

```typescript
const repository = connection.getRepository(User);
// 调用存储库方法，例如find：
const users = await repository.findOne(1);
```

* `getTreeRepository` - Gets `TreeRepository` of the given entity.
你还可以指定表名，如果找到给定表的存储库，则会返回该表。
了解更多关于 [Repositories](working-with-repository.md)。

```typescript
const repository = connection.getTreeRepository(Category);
// 调用树存储库方法，例如findTrees：
const categories = await repository.findTrees();
```

* `getMongoRepository` -获取给定实体的`MongoRepository`。
此存储库用于MongoDB连接中的实体。
了解更多关于 [MongoDB support](./mongodb.md).

```typescript
const repository = connection.getMongoRepository(User);
// 调用特定于mongodb的存储库方法，例如createEntityCursor：
const categoryCursor = repository.createEntityCursor();
const category1 = await categoryCursor.next();
const category2 = await categoryCursor.next();
```

* `getCustomRepository` - 获取自定义的存储库。
了解更多关于 [custom repositories](custom-repository.md)。

```typescript
const userRepository = connection.getCustomRepository(UserRepository);
// 调用自定义存储库中的方法 -  UserRepository类
const crazyUsers = await userRepository.findCrazyUsers();
```

* `transaction` - 提供单个事务，在单个数据库事务中执行多个数据库请求。
了解更多关于 [Transactions](./transactions.md).

```typescript
await connection.transaction(async manager => {
    // 注意：你必须使用给定的管理器实例执行所有数据库操作，
    // 它是一个使用此事务的EntityManager的特殊实例，并且不要忘记在处理操作
});
```

* `query` - 执行原始SQL查询。

```typescript
const rawData = await connection.query(`SELECT * FROM USERS`);
```

* `createQueryBuilder` - 创建一个查询构建器，可用于构建查询。
了解更多关于 [QueryBuilder](select-query-builder.md).

```typescript
const users = await connection.createQueryBuilder()
    .select()
    .from(User, "user")
    .where("user.name = :name", { name: "John" })
    .getMany();
```

* `createQueryRunner` - 创建一个用于管理和使用单个真实数据库连接的查询运行器。
了解更多关于 [QueryRunner](./query-runner.md). 

```typescript
const queryRunner = connection.createQueryRunner();

// 只有在调用connect执行真正的数据库连接后才能使用它的方法
await queryRunner.connect();

// .. 使用查询运行器并调用其方法

// 重要提示 -  一旦完成,不要忘记释放查询运行器
await queryRunner.release();
```

## `ConnectionManager` API

* `create` - 创建一个新连接并在管理器中注册。

```typescript
const connection = connectionManager.create({
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "test",
    password: "test",
    database: "test"
});
```

* `get` - 获取已经创建的连接存储在管理器中的名称。

```typescript
const defaultConnection = connectionManager.get("default");
const secondaryConnection = connectionManager.get("secondary");
```

* `has` - 检查是否在给定的连接管理器中注册了连接。

```typescript
if (connectionManager.has("default")) {
    // ...
}
```
