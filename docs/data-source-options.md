# Data Source Options

-   [What is `DataSourceOptions`](#what-is-datasourceoptions)
-   [Common data source options](#common-data-source-options)
-   [`mysql` / `mariadb` data source options](#mysql--mariadb-data-source-options)
-   [`postgres` / `cockroachdb` data source options](#postgres--cockroachdb-data-source-options)
-   [`sqlite` data source options](#sqlite-data-source-options)
-   [`better-sqlite3` data source options](#better-sqlite3-data-source-options)
-   [`capacitor` data source options](#capacitor-data-source-options)
-   [`cordova` data source options](#cordova-data-source-options)
-   [`react-native` data source options](#react-native-data-source-options)
-   [`nativescript` data source options](#nativescript-data-source-options)
-   [`mssql` data source options](#mssql-data-source-options)
-   [`mongodb` data source options](#mongodb-data-source-options)
-   [`sql.js` data source options](#sqljs-data-source-options)
-   [`expo` data source options](#expo-data-source-options)
-   [`oracle` data source options](#oracle-data-source-options)
-   [DataSource options example](#data-source-options-example)

## What is `DataSourceOptions`

`DataSourceOptions` is a data source configuration you pass when you create a new `DataSource` instance.
Different RDBMS-es have their own specific options.

## Common data source options

-   `type` - RDBMS type. You must specify what database engine you use.
    Possible values are:
    "mysql", "postgres", "cockroachdb", "sap", "spanner", "mariadb", "sqlite", "cordova", "react-native", "nativescript", "sqljs", "oracle", "mssql", "mongodb", "aurora-mysql", "aurora-postgres", "expo", "better-sqlite3", "capacitor".
    This option is **required**.

-   `extra` - Extra options to be passed to the underlying driver.
    Use it if you want to pass extra settings to underlying database driver.

-   `entities` - Entities, or Entity Schemas, to be loaded and used for this data source.
    Accepts both entity classes, entity schema classes, and directories paths to load from.
    Directories support glob patterns.
    Example: `entities: [Post, Category, "entity/*.js", "modules/**/entity/*.js"]`.
    Learn more about [Entities](entities.md).
    Learn more about [Entity Schemas](separating-entity-definition.md).

-   `subscribers` - Subscribers to be loaded and used for this data source.
    Accepts both entity classes and directories to load from.
    Directories support glob patterns.
    Example: `subscribers: [PostSubscriber, AppSubscriber, "subscriber/*.js", "modules/**/subscriber/*.js"]`.
    Learn more about [Subscribers](listeners-and-subscribers.md).

-   `migrations` - Migrations to be loaded and used for this data source.
    Accepts both migration classes and directories to load from.
    Directories support glob patterns.
    Example: `migrations: [FirstMigration, SecondMigration, "migration/*.js", "modules/**/migration/*.js"]`.
    Learn more about [Migrations](migrations.md).

-   `logging` - Indicates if logging is enabled or not.
    If set to `true` then query and error logging will be enabled.
    You can also specify different types of logging to be enabled, for example `["query", "error", "schema"]`.
    Learn more about [Logging](logging.md).

-   `logger` - Logger to be used for logging purposes. Possible values are "advanced-console", "simple-console" and "file".
    Default is "advanced-console". You can also specify a logger class that implements `Logger` interface.
    Learn more about [Logging](logging.md).

-   `maxQueryExecutionTime` - If query execution time exceed this given max execution time (in milliseconds)
    then logger will log this query.

-   `poolSize` - Configure maximum number of active connections is the pool.

-   `namingStrategy` - Naming strategy to be used to name tables and columns in the database.

-   `entityPrefix` - Prefixes with the given string all tables (or collections) on this data source.

-   `entitySkipConstructor` - Indicates if TypeORM should skip constructors when deserializing entities
    from the database. Note that when you do not call the constructor both private properties and default
    properties will not operate as expected.

-   `dropSchema` - Drops the schema each time data source is being initialized.
    Be careful with this option and don't use this in production - otherwise you'll lose all production data.
    This option is useful during debug and development.

-   `synchronize` - Indicates if database schema should be auto created on every application launch.
    Be careful with this option and don't use this in production - otherwise you can lose production data.
    This option is useful during debug and development.
    As an alternative to it, you can use CLI and run schema:sync command.
    Note that for MongoDB database it does not create schema, because MongoDB is schemaless.
    Instead, it syncs just by creating indices.

-   `migrationsRun` - Indicates if migrations should be auto run on every application launch.
    As an alternative, you can use CLI and run migration:run command.

-   `migrationsTableName` - Name of the table in the database which is going to contain information about executed migrations.
    By default, this table is called "migrations".

-   `migrationsTransactionMode` - Control transactions for migrations (default: `all`), can be one of `all` | `none` | `each`

-   `metadataTableName` - Name of the table in the database which is going to contain information about table metadata.
    By default, this table is called "typeorm_metadata".

-   `cache` - Enables entity result caching. You can also configure cache type and other cache options here.
    Read more about caching [here](caching.md).

-   `isolateWhereStatements` - Enables where statement isolation, wrapping each where clause in brackets automatically.
    eg. `.where("user.firstName = :search OR user.lastName = :search")` becomes `WHERE (user.firstName = ? OR user.lastName = ?)` instead of `WHERE user.firstName = ? OR user.lastName = ?`

## `mysql` / `mariadb` data source options

-   `url` - Connection url where the connection is performed. Please note that other data source options will override parameters set from url.

-   `host` - Database host.

-   `port` - Database host port. Default mysql port is `3306`.

-   `username` - Database username.

-   `password` - Database password.

-   `database` - Database name.

-   `charset` - The charset for the connection. This is called "collation" in the SQL-level of MySQL
    (like utf8_general_ci). If a SQL-level charset is specified (like utf8mb4) then the default collation for that charset is used. (Default: `UTF8_GENERAL_CI`).

-   `timezone` - the timezone configured on the MySQL server. This is used to typecast server date/time
    values to JavaScript Date object and vice versa. This can be `local`, `Z`, or an offset in the form
    `+HH:MM` or `-HH:MM`. (Default: `local`)

-   `connectTimeout` - The milliseconds before a timeout occurs during the initial connection to the MySQL server.
    (Default: `10000`)

-   `acquireTimeout` - The milliseconds before a timeout occurs during the initial connection to the MySql server. It differs from `connectTimeout` as it governs the TCP connection timeout where as connectTimeout does not. (default: `10000`)

-   `insecureAuth` - Allow connecting to MySQL instances that ask for the old (insecure) authentication method.
    (Default: `false`)

-   `supportBigNumbers` - When dealing with big numbers (`BIGINT` and `DECIMAL` columns) in the database,
    you should enable this option (Default: `true`)

-   `bigNumberStrings` - Enabling both `supportBigNumbers` and `bigNumberStrings` forces big numbers
    (`BIGINT` and `DECIMAL` columns) to be always returned as JavaScript String objects (Default: `true`).
    Enabling `supportBigNumbers` but leaving `bigNumberStrings` disabled will return big numbers as String
    objects only when they cannot be accurately represented with
    [JavaScript Number objects](http://ecma262-5.com/ELS5_HTML.htm#Section_8.5)
    (which happens when they exceed the `[-2^53, +2^53]` range), otherwise they will be returned as
    Number objects. This option is ignored if `supportBigNumbers` is disabled.

-   `dateStrings` - Force date types (`TIMESTAMP`, `DATETIME`, `DATE`) to be returned as strings rather than
    inflated into JavaScript Date objects. Can be true/false or an array of type names to keep as strings.
    (Default: `false`)

-   `debug` - Prints protocol details to stdout. Can be true/false or an array of packet type names that
    should be printed. (Default: `false`)

-   `trace` - Generates stack traces on Error to include call site of library entrance ("long stack traces").
    Slight performance penalty for most calls. (Default: `true`)

-   `multipleStatements` - Allow multiple mysql statements per query. Be careful with this, it could increase the scope
    of SQL injection attacks. (Default: `false`)

-   `legacySpatialSupport` - Use spatial functions like GeomFromText and AsText which are removed in MySQL 8. (Default: true)

-   `flags` - List of connection flags to use other than the default ones. It is also possible to blacklist default ones.
    For more information, check [Connection Flags](https://github.com/mysqljs/mysql#connection-flags).

-   `ssl` - object with ssl parameters or a string containing the name of ssl profile.
    See [SSL options](https://github.com/mysqljs/mysql#ssl-options).

## `postgres` / `cockroachdb` data source options

-   `url` - Connection url where the connection is performed. Please note that other data source options will override parameters set from url.

-   `host` - Database host.

-   `port` - Database host port. Default postgres port is `5432`.

-   `username` - Database username.

-   `password` - Database password.

-   `database` - Database name.

-   `schema` - Schema name. Default is "public".

-   `connectTimeoutMS` - The milliseconds before a timeout occurs during the initial connection to the postgres server. If `undefined`, or set to `0`, there is no timeout. Defaults to `undefined`.

-   `ssl` - Object with ssl parameters. See [TLS/SSL](https://node-postgres.com/features/ssl).

-   `uuidExtension` - The Postgres extension to use when generating UUIDs. Defaults to `uuid-ossp`. Can be changed to `pgcrypto` if the `uuid-ossp` extension is unavailable.

-   `poolErrorHandler` - A function that get's called when underlying pool emits `'error'` event. Takes single parameter (error instance) and defaults to logging with `warn` level.

-   `maxTransactionRetries` - A maximum number of transaction retries in case of 40001 error. Defaults to 5.

-   `logNotifications` - A boolean to determine whether postgres server [notice messages](https://www.postgresql.org/docs/current/plpgsql-errors-and-messages.html) and [notification events](https://www.postgresql.org/docs/current/sql-notify.html) should be included in client's logs with `info` level (default: `false`).

-   `installExtensions` - A boolean to control whether to install necessary postgres extensions automatically or not (default: `true`)

-   `applicationName` - A string visible in statistics and logs to help referencing an application to a connection (default: `undefined`)

-   `parseInt8` - A boolean to enable parsing 64-bit integers (int8) as JavaScript integers.
    By default int8 (bigint) values are returned as strings to avoid overflows.
    JavaScript doesn't have support for 64-bit integers, the maximum safe integer in js is: Number.MAX_SAFE_INTEGER (`+2^53`). Be careful when enabling `parseInt8`.
    Note: This option is ignored if the undelying driver does not support it.

## `sqlite` data source options

-   `database` - Database path. For example "mydb.sql"

## `better-sqlite3` data source options

-   `database` - Database path. For example "mydb.sql"

-   `statementCacheSize` - Cache size of sqlite statement to speed up queries (default 100).

-   `prepareDatabase` - Function to run before a database is used in typeorm. You can access original better-sqlite3 Database object here.

-   `nativeBinding` - Relative or absolute path to the native addon (better_sqlite3.node).

## `capacitor` data source options

-   `database` - Database name (capacitor-sqlite will add the suffix `SQLite.db`)

-   `driver` - The capacitor-sqlite instance. For example, `new SQLiteConnection(CapacitorSQLite)`.

-   `mode` - Set the mode for database encryption: "no-encryption" | "encryption" | "secret" | "newsecret"

-   `version` - Database version

-   `journalMode` - The SQLite journal mode (optional)

## `cordova` data source options

-   `database` - Database name

-   `location` - Where to save the database. See [cordova-sqlite-storage](https://github.com/litehelpers/Cordova-sqlite-storage#opening-a-database) for options.

## `react-native` data source options

-   `database` - Database name

-   `location` - Where to save the database. See [react-native-sqlite-storage](https://github.com/andpor/react-native-sqlite-storage#opening-a-database) for options.

## `nativescript` data source options

-   `database` - Database name

## `mssql` data source options
Based on [tedious](https://tediousjs.github.io/node-mssql/) MSSQL implementation. See [SqlServerConnectionOptions.ts](..\src\driver\sqlserver\SqlServerConnectionOptions.ts) for details on exposed attributes.

-   `url` - Connection url where the connection is performed. Please note that other data source options will override parameters set from url.

-   `host` - Database host.

-   `port` - Database host port. Default mssql port is `1433`.

-   `username` - Database username.

-   `password` - Database password.

-   `database` - Database name.

-   `schema` - Schema name. Default is "public".

-   `domain` - Once you set domain, the driver will connect to SQL Server using domain login.

-   `connectionTimeout` - Connection timeout in ms (default: `15000`).

-   `requestTimeout` - Request timeout in ms (default: `15000`). NOTE: msnodesqlv8 driver doesn't support
    timeouts < 1 second.

-   `stream` - Stream recordsets/rows instead of returning them all at once as an argument of callback (default: `false`).
    You can also enable streaming for each request independently (`request.stream = true`). Always set to `true` if you plan to
    work with a large amount of rows.

-   `pool.max` - The maximum number of connections there can be in the pool (default: `10`).

-   `pool.min` - The minimum of connections there can be in the pool (default: `0`).

-   `pool.maxWaitingClients` - maximum number of queued requests allowed, additional acquire calls will be callback with
    an err in a future cycle of the event loop.

-   `pool.acquireTimeoutMillis` - max milliseconds an `acquire` call will wait for a resource before timing out.
    (default no limit), if supplied should non-zero positive integer.

-   `pool.fifo` - if true the oldest resources will be first to be allocated. If false the most recently released resources
    will be the first to be allocated. This in effect turns the pool's behaviour from a queue into a stack. boolean,
    (default `true`).

-   `pool.priorityRange` - int between 1 and x - if set, borrowers can specify their relative priority in the queue if no
    resources are available. see example. (default `1`).

-   `pool.evictionRunIntervalMillis` - How often to run eviction checks. Default: `0` (does not run).

-   `pool.numTestsPerRun` - Number of resources to check each eviction run. Default: `3`.

-   `pool.softIdleTimeoutMillis` - amount of time an object may sit idle in the pool before it is eligible for eviction by
    the idle object evictor (if any), with the extra condition that at least "min idle" object instances remain in the pool.
    Default `-1` (nothing can get evicted).

-   `pool.idleTimeoutMillis` - the minimum amount of time that an object may sit idle in the pool before it is eligible for
    eviction due to idle time. Supersedes `softIdleTimeoutMillis`. Default: `30000`.

-   `pool.errorHandler` - A function that get's called when underlying pool emits `'error'` event. Takes single parameter (error instance) and defaults to logging with `warn` level.

-   `options.fallbackToDefaultDb` - By default, if the database requestion by `options.database` cannot be accessed, the connection
    will fail with an error. However, if `options.fallbackToDefaultDb` is set to `true`, then the user's default database will
    be used instead (Default: `false`).

-   `options.instanceName` - The instance name to connect to. The SQL Server Browser service must be running on the database server, and UDP port 1434 on the database server must be reachable. Mutually exclusive with `port`. (no default).

-   `options.enableAnsiNullDefault` - If true, SET ANSI_NULL_DFLT_ON ON will be set in the initial sql. This means new
    columns will be nullable by default. See the [T-SQL documentation](https://msdn.microsoft.com/en-us/library/ms187375.aspx)
    for more details. (Default: `true`).

-   `options.cancelTimeout` - The number of milliseconds before the cancel (abort) of a request is considered failed (default: `5000`).

-   `options.packetSize` - The size of TDS packets (subject to negotiation with the server). Should be a power of 2. (default: `4096`).

-   `options.useUTC` - A boolean determining whether to pass time values in UTC or local time. (default: `false`).

-   `options.abortTransactionOnError` - A boolean determining whether to rollback a transaction automatically if any
    error is encountered during the given transaction's execution. This sets the value for `SET XACT_ABORT` during the
    initial SQL phase of a connection ([documentation](http://msdn.microsoft.com/en-us/library/ms188792.aspx)).

-   `options.localAddress` - A string indicating which network interface (ip address) to use when connecting to SQL Server.

-   `options.useColumnNames` - A boolean determining whether to return rows as arrays or key-value collections. (default: `false`).

-   `options.camelCaseColumns` - A boolean, controlling whether the column names returned will have the first letter
    converted to lower case (`true`) or not. This value is ignored if you provide a `columnNameReplacer`. (default: `false`).

-   `options.isolationLevel` - The default isolation level that transactions will be run with. The isolation levels are
    available from `require('tedious').ISOLATION_LEVEL`.

    -   `READ_UNCOMMITTED`
    -   `READ_COMMITTED`
    -   `REPEATABLE_READ`
    -   `SERIALIZABLE`
    -   `SNAPSHOT`

    (default: `READ_COMMITTED`)

-   `options.connectionIsolationLevel` - The default isolation level for new connections. All out-of-transaction queries
    are executed with this setting. The isolation levels are available from `require('tedious').ISOLATION_LEVEL`.

    -   `READ_UNCOMMITTED`
    -   `READ_COMMITTED`
    -   `REPEATABLE_READ`
    -   `SERIALIZABLE`
    -   `SNAPSHOT`

    (default: `READ_COMMITTED`)

-   `options.readOnlyIntent` - A boolean, determining whether the connection will request read-only access from a
    SQL Server Availability Group. For more information, see here. (default: `false`).

-   `options.encrypt` - A boolean determining whether or not the connection will be encrypted. Set to true if you're
    on Windows Azure. (default: `true`).

-   `options.cryptoCredentialsDetails` - When encryption is used, an object may be supplied that will be used for the
    first argument when calling [tls.createSecurePair](http://nodejs.org/docs/latest/api/tls.html#tls_tls_createsecurepair_credentials_isserver_requestcert_rejectunauthorized)
    (default: `{}`).

-   `options.rowCollectionOnDone` - A boolean, that when true will expose received rows in Requests' `done*` events.
    See done, [doneInProc](http://tediousjs.github.io/tedious/api-request.html#event_doneInProc)
    and [doneProc](http://tediousjs.github.io/tedious/api-request.html#event_doneProc). (default: `false`)

    Caution: If many rows are received, enabling this option could result in excessive memory usage.

-   `options.rowCollectionOnRequestCompletion` - A boolean, that when true will expose received rows
    in Requests' completion callback. See [new Request](http://tediousjs.github.io/tedious/api-request.html#function_newRequest). (default: `false`)

    Caution: If many rows are received, enabling this option could result in excessive memory usage.

-   `options.tdsVersion` - The version of TDS to use. If the server doesn't support the specified version, a negotiated version
    is used instead. The versions are available from `require('tedious').TDS_VERSION`.

    -   `7_1`
    -   `7_2`
    -   `7_3_A`
    -   `7_3_B`
    -   `7_4`

    (default: `7_4`)

-   `options.appName` - Application name used for identifying a specific application in profiling, logging or tracing tools of SQL Server. (default: `node-mssql`)

-   `options.trustServerCertificate` - A boolean, controlling whether encryption occurs if there is no verifiable server certificate. (default: `false`)

-   `options.debug.packet` - A boolean, controlling whether `debug` events will be emitted with text describing packet
    details (default: `false`).

-   `options.debug.data` - A boolean, controlling whether `debug` events will be emitted with text describing packet data
    details (default: `false`).

-   `options.debug.payload` - A boolean, controlling whether `debug` events will be emitted with text describing packet
    payload details (default: `false`).

-   `options.debug.token` - A boolean, controlling whether `debug` events will be emitted with text describing token stream
    tokens (default: `false`).

## `mongodb` data source options

-   `url` - Connection url where the connection is performed. Please note that other data source options will override parameters set from url.

-   `host` - Database host.

-   `port` - Database host port. Default mongodb port is `27017`.

-   `username` - Database username (replacement for `auth.user`).

-   `password` - Database password (replacement for `auth.password`).

-   `database` - Database name.

-   `poolSize` - Set the maximum pool size for each individual server or proxy connection.

-   `ssl` - Use ssl connection (needs to have a mongod server with ssl support). Default: `false`.

-   `sslValidate` - Validate mongod server certificate against ca (needs to have a mongod server with ssl support,
    2.4 or higher). Default: `true`.

-   `sslCA` - Array of valid certificates either as Buffers or Strings (needs to have a mongod server with ssl support,
    2.4 or higher).

-   `sslCert` - String or buffer containing the certificate we wish to present (needs to have a mongod server with ssl
    support, 2.4 or higher)

-   `sslKey` - String or buffer containing the certificate private key we wish to present (needs to have a mongod server
    with ssl support, 2.4 or higher).

-   `sslPass` - String or buffer containing the certificate password (needs to have a mongod server with ssl support,
    2.4 or higher).

-   `autoReconnect` - Reconnect on error. Default: `true`.

-   `noDelay` - TCP Socket NoDelay option. Default: `true`.

-   `keepAlive` - The number of milliseconds to wait before initiating keepAlive on the TCP socket. Default: `30000`.

-   `connectTimeoutMS` - TCP Connection timeout setting. Default: `30000`.

-   `socketTimeoutMS` - TCP Socket timeout setting. Default: `360000`.

-   `reconnectTries` - Server attempt to reconnect #times. Default: `30`.

-   `reconnectInterval` - Server will wait #milliseconds between retries. Default: `1000`.

-   `ha` - Turn on high availability monitoring. Default: `true`.

-   `haInterval` - Time between each replicaset status check. Default: `10000,5000`.

-   `replicaSet` - The name of the replicaset to connect to.

-   `acceptableLatencyMS` - Sets the range of servers to pick when using NEAREST (lowest ping ms + the latency fence,
    ex: range of 1 to (1 + 15) ms). Default: `15`.

-   `secondaryAcceptableLatencyMS` - Sets the range of servers to pick when using NEAREST (lowest ping ms + the latency
    fence, ex: range of 1 to (1 + 15) ms). Default: `15`.

-   `connectWithNoPrimary` - Sets if the driver should connect even if no primary is available. Default: `false`.

-   `authSource` - If the database authentication is dependent on another databaseName.

-   `w` - The write concern.

-   `wtimeout` - The write concern timeout value.

-   `j` - Specify a journal write concern. Default: `false`.

-   `forceServerObjectId` - Force server to assign \_id values instead of driver. Default: `false`.

-   `serializeFunctions` - Serialize functions on any object. Default: `false`.

-   `ignoreUndefined` - Specify if the BSON serializer should ignore undefined fields. Default: `false`.

-   `raw` - Return document results as raw BSON buffers. Default: `false`.

-   `promoteLongs` - Promotes Long values to number if they fit inside the 53 bits resolution. Default: `true`.

-   `promoteBuffers` - Promotes Binary BSON values to native Node Buffers. Default: `false`.

-   `promoteValues` - Promotes BSON values to native types where possible, set to false to only receive wrapper types.
    Default: `true`.

-   `domainsEnabled` - Enable the wrapping of the callback in the current domain, disabled by default to avoid perf hit.
    Default: `false`.

-   `bufferMaxEntries` - Sets a cap on how many operations the driver will buffer up before giving up on getting a
    working connection, default is -1 which is unlimited.

-   `readPreference` - The preferred read preference.

    -   `ReadPreference.PRIMARY`
    -   `ReadPreference.PRIMARY_PREFERRED`
    -   `ReadPreference.SECONDARY`
    -   `ReadPreference.SECONDARY_PREFERRED`
    -   `ReadPreference.NEAREST`

-   `pkFactory` - A primary key factory object for generation of custom \_id keys.

-   `promiseLibrary` - A Promise library class the application wishes to use such as Bluebird, must be ES6 compatible.

-   `readConcern` - Specify a read concern for the collection. (only MongoDB 3.2 or higher supported).

-   `maxStalenessSeconds` - Specify a maxStalenessSeconds value for secondary reads, minimum is 90 seconds.

-   `appname` - The name of the application that created this MongoClient instance. MongoDB 3.4 and newer will print this
    value in the server log upon establishing each connection. It is also recorded in the slow query log and profile
    collections

-   `loggerLevel` - Specify the log level used by the driver logger (`error/warn/info/debug`).

-   `logger` - Specify a customer logger mechanism, can be used to log using your app level logger.

-   `authMechanism` - Sets the authentication mechanism that MongoDB will use to authenticate the connection.

-   `directConnection` - Specifies whether to force dispatch all operations to the specified host.

## `sql.js` data source options

-   `database`: The raw UInt8Array database that should be imported.

-   `sqlJsConfig`: Optional initialize config for sql.js.

-   `autoSave`: Whether or not autoSave should be disabled. If set to true the database will be saved to the given file location (Node.js) or LocalStorage element (browser) when a change happens and `location` is specified. Otherwise `autoSaveCallback` can be used.

-   `autoSaveCallback`: A function that get's called when changes to the database are made and `autoSave` is enabled. The function gets a `UInt8Array` that represents the database.

-   `location`: The file location to load and save the database to.

-   `useLocalForage`: Enables the usage of the localforage library (https://github.com/localForage/localForage) to save & load the database asynchronously from the indexedDB instead of using the synchrony local storage methods in a browser environment. The localforage node module needs to be added to your project and the localforage.js should be imported in your page.

## `expo` data source options

-   `database` - Name of the database. For example, "mydb".
-   `driver` - The Expo SQLite module. For example, `require('expo-sqlite')`.

## `oracle` data source options

The following TNS connection string will be used in the next explanations:

```bash
(DESCRIPTION=
  (ADDRESS=(PROTOCOL=tcp)(HOST=sales-server)(PORT=1521))
  (CONNECT_DATA=
     (SID=sales)
     (SERVICE_NAME=sales.us.example.com)
     (INSTANCE_NAME=sales))
     (SERVER=shared)))
)
```
-   `sid` - The System Identifier (SID) identifies a specific database instance. For example, "sales".
-   `serviceName` - The Service Name is an identifier of a database service. For example, `sales.us.example.com`.


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
