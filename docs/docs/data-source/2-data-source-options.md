# Data Source Options

## What is DataSourceOptions?

`DataSourceOptions` is a data source configuration you pass when you create a new `DataSource` instance.
Different RDBMS-es have their own specific options.

## Common data source options

- `type` - RDBMS type. You must specify what database engine you use.
  Possible values are:
  "mysql", "postgres", "cockroachdb", "sap", "spanner", "mariadb", "sqlite", "cordova", "react-native", "nativescript", "sqljs", "oracle", "mssql", "mongodb", "aurora-mysql", "aurora-postgres", "expo", "better-sqlite3", "capacitor".
  This option is **required**.

- `extra` - Extra options to be passed to the underlying driver.
  Use it if you want to pass extra settings to the underlying database driver.

- `entities` - Entities, or Entity Schemas, to be loaded and used for this data source.
  It accepts entity classes, entity schema classes, and directory paths from which to load.
  Directories support glob patterns.
  Example: `entities: [Post, Category, "entity/*.js", "modules/**/entity/*.js"]`.
  Learn more about [Entities](../entity/1-entities.md).
  Learn more about [Entity Schemas](../entity/6-separating-entity-definition.md).

- `subscribers` - Subscribers to be loaded and used for this data source.
  It accepts both entity classes and directories from which to load.
  Directories support glob patterns.
  Example: `subscribers: [PostSubscriber, AppSubscriber, "subscriber/*.js", "modules/**/subscriber/*.js"]`.
  Learn more about [Subscribers](../advanced-topics/4-listeners-and-subscribers.md).

- `logging` - Indicates if logging is enabled or not.
  If set to `true` then query and error logging will be enabled.
  You can also specify different types of logging to be enabled, for example `["query", "error", "schema"]`.
  Learn more about [Logging](../advanced-topics/5-logging.md).

- `logger` - Logger to be used for logging purposes. Possible values are "advanced-console", "formatted-console", "simple-console" and "file".
  Default is "advanced-console". You can also specify a logger class that implements `Logger` interface.
  Learn more about [Logging](../advanced-topics/5-logging.md).

- `maxQueryExecutionTime` - If query execution time exceed this given max execution time (in milliseconds)
  then logger will log this query.

- `poolSize` - Configure maximum number of active connections is the pool.

- `namingStrategy` - Naming strategy to be used to name tables and columns in the database.

- `entityPrefix` - Prefixes with the given string all tables (or collections) on this data source.

- `entitySkipConstructor` - Indicates if TypeORM should skip constructors when deserializing entities
  from the database. Note that when you do not call the constructor both private properties and default
  properties will not operate as expected.

- `dropSchema` - Drops the schema each time data source is being initialized.
  Be careful with this option and don't use this in production - otherwise you'll lose all production data.
  This option is useful during debug and development.

- `synchronize` - Indicates if database schema should be auto created on every application launch.
  Be careful with this option and don't use this in production - otherwise you can lose production data.
  This option is useful during debug and development.
  As an alternative to it, you can use CLI and run schema:sync command.
  Note that for MongoDB database it does not create schema, because MongoDB is schemaless.
  Instead, it syncs just by creating indices.

- `migrations` - [Migrations](../migrations/01-why.md) to be loaded and used for this data source

- `migrationsRun` - Indicates if [migrations](../migrations/01-why.md) should be auto-run on every application launch.

- `migrationsTableName` - Name of the table in the database which is going to contain information about executed [migrations](../migrations/01-why.md).

- `migrationsTransactionMode` - Controls transaction mode when running [migrations](../migrations/01-why.md).

- `metadataTableName` - Name of the table in the database which is going to contain information about table metadata.
  By default, this table is called "typeorm_metadata".

- `cache` - Enables entity result caching. You can also configure cache type and other cache options here.
  Read more about caching [here](../query-builder/6-caching.md).

- `isolateWhereStatements` - Enables where statement isolation, wrapping each where clause in brackets automatically.
  eg. `.where("user.firstName = :search OR user.lastName = :search")` becomes `WHERE (user.firstName = ? OR user.lastName = ?)` instead of `WHERE user.firstName = ? OR user.lastName = ?`

- `invalidWhereValuesBehavior` - Controls how null and undefined values are handled in where conditions across all TypeORM operations (find operations, query builders, repository methods).
    - `null` behavior options:
        - `'ignore'` (default) - skips null properties
        - `'sql-null'` - transforms null to SQL NULL
        - `'throw'` - throws an error
    - `undefined` behavior options:
        - `'ignore'` (default) - skips undefined properties
        - `'throw'` - throws an error

    Example: `invalidWhereValuesBehavior: { null: 'sql-null', undefined: 'throw' }`.

    Learn more about [Null and Undefined Handling](./5-null-and-undefined-handling.md).

## Data Source Options example

Here is a small example of data source options for mysql:

```typescript
{
    host: "localhost",
    port: 3306,
    username: "test",
    password: "test",
    database: "test",
    logging: true,
    synchronize: true,
    entities: [
        "entity/*.js"
    ],
    subscribers: [
        "subscriber/*.js"
    ],
    entitySchemas: [
        "schema/*.json"
    ],
    migrations: [
        "migration/*.js"
    ]
}
```
