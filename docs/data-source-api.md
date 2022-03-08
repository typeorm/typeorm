# DataSource API

-   `options` - Options used to create this dataSource.
    Learn more about [DataSourceOptions](./datasourceoptions.md).

```typescript
const dataSourceOptions: DataSourceOptions = dataSource.options
```

-   `isConnected` - Indicates if initial connection / connection pool with database was established or not.

```typescript
const isConnected: boolean = dataSource.isConnected
```

-   `driver` - Underlying database driver used in this dataSource.

```typescript
const driver: Driver = dataSource.driver
```

-   `manager` - `EntityManager` used to work with entities.
    Learn more about [Entity Manager and Repository](working-with-entity-manager.md).

```typescript
const manager: EntityManager = dataSource.manager
// you can call manager methods, for example find:
const user = await manager.findOne(1)
```

-   `mongoManager` - `MongoEntityManager` used to work with entities for mongodb data source.
    For more information about MongoEntityManager see [MongoDB](./mongodb.md) documentation.

```typescript
const manager: MongoEntityManager = dataSource.mongoManager
// you can call manager or mongodb-manager specific methods, for example find:
const user = await manager.findOne(1)
```

-   `connect` - Performs connection to the database.

```typescript
await dataSource.connect()
```

-   `close` - Closes connection with the database.
    Usually, you call this method when your application is shutting down.

```typescript
await dataSource.close()
```

-   `synchronize` - Synchronizes database schema. When `synchronize: true` is set in data source options it calls this method.
    Usually, you call this method when your application is starting.

```typescript
await dataSource.synchronize()
```

-   `dropDatabase` - Drops the database and all its data.
    Be careful with this method on production since this method will erase all your database tables and their data.
    Can be used only after connection to the database is established.

```typescript
await dataSource.dropDatabase()
```

-   `runMigrations` - Runs all pending migrations.

```typescript
await dataSource.runMigrations()
```

-   `undoLastMigration` - Reverts last executed migration.

```typescript
await dataSource.undoLastMigration()
```

-   `hasMetadata` - Checks if metadata for a given entity is registered.
    Learn more about [Entity Metadata](./entity-metadata.md).

```typescript
if (dataSource.hasMetadata(User))
    const userMetadata = dataSource.getMetadata(User)
```

-   `getMetadata` - Gets `EntityMetadata` of the given entity.
    You can also specify a table name and if entity metadata with such table name is found it will be returned.
    Learn more about [Entity Metadata](./entity-metadata.md).

```typescript
const userMetadata = dataSource.getMetadata(User)
// now you can get any information about User entity
```

-   `getRepository` - Gets `Repository` of the given entity.
    You can also specify a table name and if repository for given table is found it will be returned.
    Learn more about [Repositories](working-with-repository.md).

```typescript
const repository = dataSource.getRepository(User)
// now you can call repository methods, for example find:
const users = await repository.findOne(1)
```

-   `getTreeRepository` - Gets `TreeRepository` of the given entity.
    You can also specify a table name and if repository for given table is found it will be returned.
    Learn more about [Repositories](working-with-repository.md).

```typescript
const repository = dataSource.getTreeRepository(Category)
// now you can call tree repository methods, for example findTrees:
const categories = await repository.findTrees()
```

-   `getMongoRepository` - Gets `MongoRepository` of the given entity.
    This repository is used for entities in MongoDB dataSource.
    Learn more about [MongoDB support](./mongodb.md).

```typescript
const repository = dataSource.getMongoRepository(User)
// now you can call mongodb-specific repository methods, for example createEntityCursor:
const categoryCursor = repository.createEntityCursor()
const category1 = await categoryCursor.next()
const category2 = await categoryCursor.next()
```

-   `getCustomRepository` - Gets custom defined repository.
    Learn more about [custom repositories](custom-repository.md).

```typescript
const userRepository = dataSource.getCustomRepository(UserRepository)
// now you can call methods inside your custom repository - UserRepository class
const crazyUsers = await userRepository.findCrazyUsers()
```

-   `transaction` - Provides a single transaction where multiple database requests will be executed in a single database transaction.
    Learn more about [Transactions](./transactions.md).

```typescript
await dataSource.transaction(async (manager) => {
    // NOTE: you must perform all database operations using given manager instance
    // its a special instance of EntityManager working with this transaction
    // and don't forget to await things here
})
```

-   `query` - Executes a raw SQL query.

```typescript
const rawData = await dataSource.query(`SELECT * FROM USERS`)
```

-   `createQueryBuilder` - Creates a query builder, which can be used to build queries.
    Learn more about [QueryBuilder](select-query-builder.md).

```typescript
const users = await dataSource
    .createQueryBuilder()
    .select()
    .from(User, "user")
    .where("user.name = :name", { name: "John" })
    .getMany()
```

-   `createQueryRunner` - Creates a query runner used to manage and work with a single real database dataSource.
    Learn more about [QueryRunner](./query-runner.md).

```typescript
const queryRunner = dataSource.createQueryRunner()

// you can use its methods only after you call connect
// which performs real database connection
await queryRunner.connect()

// .. now you can work with query runner and call its methods

// very important - don't forget to release query runner once you finished working with it
await queryRunner.release()
```
