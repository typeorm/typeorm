# Connection 选项

  - [什么是`ConnectionOptions`](#什么是`ConnectionOptions`)
  - [常用的连接选项](#常用的连接选项)
  - [`mysql`/`mariadb`](#mysql/mariadb)
  - [`postgres`/`cockroachdb`连接选项](#postgres/cockroachdb连接选项)
  - [`sqlite`](#sqlite)
  - [`better-sqlite3`](#better-sqlite3)
  - [`cordova`](#cordova)
  - [`react-native`](#react-native)
  - [`nativescript`](#nativescript)
  - [`mssql`](#mssql)
  - [`mongodb`](#mongodb)
  - [`sql.js`](#sqljs)
  - [`expo`](#expo)
  - [连接选项示例](#连接选项示例)

## 什么是`ConnectionOptions`

连接选项是你传递给`createConnection`或在`ormconfig`文件中定义的连接配置。不同的数据库有自己的特定连接选项。

## 常用的连接选项

- `type` - 数据库类型。你必须指定要使用的数据库引擎。该值可以是"mysql"，"postgres"，"mariadb"，"sqlite", "better-sqlite3"，"cordova"，"nativescript"，"oracle"，"mssql"，"mongodb"，"sqljs"，"react-native"。此选项是**必需**的。

- `name` - 连接名。 在使用 `getConnection(name: string)`
  或 `ConnectionManager.get(name: string)`时候需要用到。不同连接的连接名称不能相同，它们都必须是唯一的。如果没有给出连接名称，那么它将被设置为"default"。

- `extra` - 要传递给底层驱动程序的额外连接选项。如果要将额外设置传递给基础数据库驱动程序，请使用此配置。

- `entities` - 要加载并用于此连接的实体。接受要加载的实体类和目录路径。目录支持 glob 模式。示例：`entities: [Post, Category, "entity/*.js", "modules/**/entity/*.js"]`。了解有关[entities](./entities.md)的更多信息。

- `subscribers` - 要加载并用于此连接的订阅者。接受要加载的实体类和目录。目录支持 glob 模式。示例：`subscribers: [PostSubscriber, AppSubscriber, "subscriber/*.js", "modules/**/subscriber/*.js"]`。了解有关[subscribers](listeners-and-subscribers.md)的更多信息。

- `entitySchemas` - 要加载并用于此连接的实体架构。接受要加载的实体模式类和目录。目录支持 glob 模式。示例：`entitySchemas: [PostSchema, CategorySchema, "entity-schema/*.json"`。了解有关[Entity Schemas](./schema-entity-definition.md)的更多信息。

- `migrations` - 要加载和用于此连接的迁移。接受要加载的迁移类和目录。目录支持 glob 模式。
  示例: `migrations: [FirstMigration, SecondMigration, "migration/*.js", "modules/**/migration/*.js"]`.
  了解有关 [Migrations](./migrations.md)的更多信息。

- `logging` - 指示是否启用日志记录。如果设置为`true`，则将启用查询和错误日志记录。你还可以指定要启用的不同类型的日志记录，例如`["query", "error", "schema"]`。详细了解[Logging](./logging.md)。

- `logger` - 记录器，用于日志的记录方式。可能的值是"advanced-console", "simple-console" 和 "file"。默认为"advanced-console"。你还可以指定实现`Logger`接口的记录器类。详细了解[Logging](./logging.md)。

- `maxQueryExecutionTime` - 如果查询执行时间超过此给定的最大执行时间（以毫秒为单位），则 logger 将记录此查询。

- `namingStrategy` - 命名策略，用于命名数据 ​​ 库中的表和列。了解有关[Naming strategies](./naming-strategy.md)的更多信息。

- `entityPrefix` - 给此数据库连接上的所有表（或集合）加的前缀。

- `dropSchema` - 每次建立连接时删除架构。请注意此选项，不要在生产环境中使用它，否则将丢失所有生产数据。但是此选项在调试和开发期间非常有用。

- `synchronize` - 指示是否在每次应用程序启动时自动创建数据库架构。
  请注意此选项，不要在生产环境中使用它，否则将丢失所有生产数据。但是此选项在调试和开发期间非常有用。作为替代方案，你可以使用 CLI 运行 schema：sync 命令。请注意，对于 MongoDB 数据库，它不会创建模式，因为 MongoDB 是无模式的。相反，它只是通过创建索引来同步。

- `migrationsRun` - 指示是否在每次启动应用程序时自动运行迁移。或者，您可以使用 CLI run migrations:run command

- `migrationsTableName` - 数据库中将包含有关已执行迁移的信息的表的名称。默认情况下，此表名为"migrations"。

- `cache` - 启用实体结果缓存。你还可以在此处配置缓存类型和其他缓存选项。阅读更多有关[caching](./caching.md)的信息。

- `cli.entitiesDir` - CLI 默认情况下创建实体的目录。

- `cli.migrationsDir` - CLI 默认情况下创建迁移的目录。

- `cli.subscribersDir` - CLI 默认情况下创建订阅者的目录。

## `mysql`/`mariadb`

- `url` - 连接 URL

- `host` - 数据库 host

- `port` - 数据库端口。mysql 默认的端口是`3306`.

- `username` - 数据库用户名

- `password` - 数据库密码

- `database` - 数据库名

- `charset` - 连接的字符集。这在 MySQL 的 SQL 级别中称为"collation"（如 utf8_general_ci）。如果指定了 SQL 级别的字符集（如 utf8mb4），则使用该字符集的默认排序规则。 （默认值：UTF8_GENERAL_CI）。

- `timezone` - MySQL 服务器上配置的时区。这用于将服务器日期/时间值强制转换为 JavaScript Date 对象，反之亦然。该值可以是`local`，`Z`或`+HHMM`或`-HHMM`形式的偏移。 （默认：`local`）

- `connectTimeout` - 在连接到 MySQL 服务器期间发生超时之前的毫秒数。 （默认值：`10000`）

- `insecureAuth` - 允许连接到要求旧（不安全）身份验证方法的 MySQL 实例。 （默认值：`false`）

- `supportBigNumbers` - 处理数据库中的大数字（`BIGINT`和`DECIMAL`列）时，应启用此选项（默认值：`false`）

- `bigNumberStrings` - 同时启用`supportBigNumbers`和`bigNumberStrings`会强制将大数字（`BIGINT`和`DECIMAL`列）作为 JavaScript String 对象返回（默认值：`false`）。启用`supportBigNumbers`但禁用`bigNumberStrings`仅当它们无法用 JavaScript Number 对象准确表示时才会返回大数字作为 String 对象（当它们超过`[-2^53，+2^53]`范围时会发生），否则它们将被返回作为数字对象。如果禁用了`supportBigNumbers`，则忽略此选项。

- `dateStrings` - 强制日期类型（`TIMESTAMP`，`DATETIME`，`DATE`）作为字符串返回，而不是转换为 JavaScript Date 对象。可以是 true/false 或要保留为字符串的类型名称数组。 （默认值：`false`）

- `debug` - 将协议详细信息打印到 stdout。可以是 true/false 或应打印的数据包类型名称数组。 （默认值：`false`）

- `trace` - 在 Error 上生成堆栈跟踪,包括库入口的调用站点（"long stack traces"）。对大多调用来说，性能损失很轻。 （默认值：`true`）

- `multipleStatements` - 每个查询允许多个 mysql 语句。请注意，它可能会增加 SQL 注入攻击的范围。 （默认值：`false`）

- `legacySpatialSupport` - Use spatial functions like GeomFromText and AsText which are removed in MySQL 8. (Default: true)

- `flags` - 使用非默认连接标志的连接标志列表。也可以将默认值列入黑名单。有关更多信息，请查看[Connection Flags](https://github.com/mysqljs/mysql#connection-flags)。

- `ssl` - 带有 ssl 参数的对象或包含 ssl 配置文件名称的字符串。请参阅[SSL 选项](https://github.com/mysqljs/mysql#ssl-options)。

## `postgres`/`cockroachdb`连接选项

- `url` - 连接 URL

- `host` - 数据库主机

- `port` - 数据库端口， postgres 默认端口是 `5432`。

- `username` - 数据库用户名

- `password` - 数据库密码

- `database` - 数据库名称

- `schema` - Schema 名称，默认是 "public".

- `ssl` - 带有 ssl 参数的对象。 详见 [TLS/SSL](https://node-postgres.com/features/ssl)。

- `uuidExtension` - 生成UUID时使用的Postgres扩展。 默认为`uuid-ossp`。 如果`uuid-ossp`扩展不可用，可以更改为`pgcrypto`。

## `sqlite`

- `database` - 数据库路径。 例如 "./mydb.sql"

## `better-sqlite3`

* `database` - 数据库路径。 例如 "./mydb.sql"

* `statementCacheSize` - Sqlite 查询 Statement 缓存大小。默认100

* `prepareDatabase` - 在数据库投入使用前运行的函数。你可以在这里访问到better-sqlite3原始数据库对象。

## `cordova`

- `database` - 数据库名

- `location` - 数据库存储位置。 详见 [cordova-sqlite-storage](https://github.com/litehelpers/Cordova-sqlite-storage#opening-a-database)。

## `react-native`

- `database` - 数据库名

- `location` - 数据库存储位置。详见 [react-native-sqlite-storage](https://github.com/andpor/react-native-sqlite-storage#opening-a-database) 。

## `nativescript`

- `database` - 数据库名

## `mssql`

- `url` - 连接 URL

- `host` - 数据库主机

- `port` - 端口。mssql 默认端口是 `1433`.

- `username` - 用户名

- `password` - 密码

- `database` - 数据库名

- `schema` - Schema 名称。 默认"public".

- `domain` - 设置 domain 后，驱动程序将使用 domain 登录连接到 SQL Server。

- `connectionTimeout` - 超时时间，毫秒为单位 (默认: `15000`)。

- `requestTimeout` - 请求超时时间，毫秒为单位 (默认: `15000`)。注意: msnodesqlv8 驱动不支持
  timeouts < 1 秒

- `stream` - Stream recordsets/rows instead of returning them all at once as an argument of callback（默认值：`false`）。你还可以单独为每个请求启用 streaming（`request.stream = true`）。如果你计划使用大量 rows，请始终设置为`true`。

- `pool.max` - 连接池的最大数 (默认: `10`).

- `pool.min` - 连接池的最小数 (默认: `0`).

- `pool.maxWaitingClients` - 允许的最大队列请求数，在事件循环的未来周期中，将使用错误回调其他获取调用。

- `pool.testOnBorrow` - 如果连接池在将资源提供给客户端之前验证资源。需要指定`factory.validate`或`factory.validateAsync`。

- `pool.acquireTimeoutMillis` - 最大毫秒，`acquire`调用将在超时之前等待资源。（默认无限制），如果提供的话应该是非零正整数。

- `pool.fifo` - 如果为true，则首先分配最旧的资源。 如果为false，则表示最近发布的资源将是第一个被分配的。这实际上将池的行为从队列转换为堆栈。布尔值，(默认为`true`)。

- `pool.priorityRange` - 1和x之间的int值  - 如果设置了且没有可用资源，则borrowers可以在队列中指定其相对优先级(默认 `1`)。

- `pool.autostart` - 布尔值，一旦调用构造函数，池应该开始创建资源等（默认为`true`）。

- `pool.victionRunIntervalMillis` - 多久检查一次eviction checks。 默认值：`0`（不运行）。

- `pool.numTestsPerRun` - 每次eviction checks资源数量。 默认值：`3`。

- `pool.softIdleTimeoutMillis` - 在空闲对象逐出器（如果有的话）有资格驱逐之前，对象可以在池中空闲的时间量，其中额外条件是至少"最小空闲"对象实例保留在池中。默认 `-1` (nothing can get evicted).

- `pool.idleTimeoutMillis` - 对象在由于空闲时间而有资格被驱逐之前可能在池中闲置的最短时间。 取代`softIdleTimeoutMillis`。 默认值：`30000`。

- `options.fallbackToDefaultDb` - 默认情况下，如果无法访问`options.database`的数据库请求，则连接将失败并显示错误。 但是，如果`options.fallbackToDefaultDb`设置为`true`，则将改为使用用户的默认数据库（默认值：`false`）。

- `options.enableAnsiNullDefault` - 如果为true，则在初始sql中设置SET ANSI_NULL_DFLT_ON ON。 这意味着默认情况下新列可以为空。 有关更多详细信息，请参阅[T-SQL文档](https://msdn.microsoft.com/en-us/library/ms187375.aspx)。 （默认值：`true`）。

- `options.cancelTimeout` - 取消（中止）请求之前的毫秒数被视为失败（默认值：`5000`）。

- `options.packetSize` - TDS数据包的大小（需要与服务器协商）。 应该是2的幂。（默认值：`4096`）。

- `options.useUTC` - 布尔值，用于确定是以UTC还是本地时间。(默认：`true`)。

- `options.abortTransactionOnError` - 如果在给定事务执行期间遇到任何错误，则确定是否自动回滚事务的布尔值。 这将在连接的初始SQL阶段设置`SET XACT_ABORT`的值（[文档](http://msdn.microsoft.com/en-us/library/ms188792.aspx))。

- `options.localAddress` - 字符串，指示连接到SQL Server时要使用的网络接口（IP地址）。

- `options.useColumnNames` - 布尔值，用于确定是将行作为数组还是键值集合返回。 （默认：`false`）。

- `options.camelCaseColumns` - 布尔值，控制返回的列名是否将第一个字母转换为小写（`true`为小写）。 如果提供`columnNameReplacer`，则忽略该值。 （默认：`false`）。

- `options.isolationLevel` - 将运行事务的默认隔离级别。 隔离级别可从`require（'tedious').ISOLATION_LEVEL`获得。

  - `READ_UNCOMMITTED`
  - `READ_COMMITTED`
  - `REPEATABLE_READ`
  - `SERIALIZABLE`
  - `SNAPSHOT`

  (默认: `READ_COMMITTED`)

- `options.connectionIsolationLevel` - 新连接的默认隔离级别。 使用此设置执行所有事务外查询。 隔离级别可从`require('tedious').ISOLATION_LEVEL`获得。

  - `READ_UNCOMMITTED`
  - `READ_COMMITTED`
  - `REPEATABLE_READ`
  - `SERIALIZABLE`
  - `SNAPSHOT`

  (默认: `READ_COMMITTED`)

- `options.readOnlyIntent` - 布尔值，确定连接是否将从SQL Server可用性组请求只读访问权限。 有关更多信息，请参阅此处。 （默认：`false`）。

- `options.encrypt` - 确定连接是否将被加密的布尔值。 如果您使用的是Windows Azure，请设置为true。 （默认：`false`）。

- `options.cryptoCredentialsDetails` - 使用加密时，可以提供一个对象，该对象在调用[tls.createSecurePair](http://nodejs.org/docs/latest/api/tls.html#tls_tls_createsecurepair_credentials_isserver_requestcert_rejectunauthorized)时将用于第一个参数（默认值：`{}`）。

- `options.rowCollectionOnDone` - 布尔值，当为true时将在Requests的`done *`事件中公开接收到的行。
  查看 done, [doneInProc](http://tediousjs.github.io/tedious/api-request.html#event_doneInProc)
  和 [doneProc](http://tediousjs.github.io/tedious/api-request.html#event_doneProc). (默认: `false`)

  注意：如果收到很多行，启用此选项可能会导致内存使用过多。

- `options.rowCollectionOnRequestCompletion` - 布尔值，当为true时将在请求的完成回调中公开接收的行。 查看 [new Request](http://tediousjs.github.io/tedious/api-request.html#function_newRequest). (默认: `false`)

  注意：如果收到很多行，启用此选项可能会导致内存使用过多。

- `options.tdsVersion` - 要使用的TDS版本。 如果服务器不支持指定的版本，则使用协商的版本。 这些版本可以从`require('tedious').TDS_VERSION`获得。

  - `7_1`
  - `7_2`
  - `7_3_A`
  - `7_3_B`
  - `7_4`

  (默认: `7_4`)

- `options.debug.packet` - 布尔值，控制是否将使用描述数据包详细信息的文本发出`debug`事件（默认值：`false`）。

- `options.debug.data` - 布尔值，控制是否将发出`debug`事件，文本描述包数据细节（默认值：`false`）。

- `options.debug.payload` - 布尔值，控制是否使用描述数据包有效负载详细信息的文本发出`debug`事件（默认值：`false`）。

- `options.debug.token` - 布尔值，控制是否将使用描述令牌流令牌的文本发出`debug`事件（默认值：`false`）。

> 注： 由于译者对mssql理解不够深入，故一些翻译直接使用了机翻，因此会有些词不达意，如有更好的翻译选项，请提交PR进行完善。

## `mongodb`

- `url` - 连接 URL

- `host` - 数据库主机

- `port` - 端口号，mongodb 默认端口是`27017`

- `database` - 数据库名

- `poolSize` - 设置每个服务器或代理连接的最大池大小

- `ssl` - 使用 ssl 连接（需要有支持 ssl 的 mongod 服务器）。默认值：`false`。

- `sslValidate` - 针对 ca 验证 mongod 服务器证书（需要具有 ssl 支持的，2.4 或更高版本的 mongod 服务器）。默认值：`true`。

- `sslCA` - 有效证书的数组，可以是 Buffers 或 Strings（需要具有支持 ssl 的，2.4 或更高版本的 mongod 服务器）。

- `sslCert` - 包含我们希望提供的证书的字符串或缓冲区（需要具有支持 ssl 的，2.4 或更高版本的 mongod 服务器）。

- `sslKey` - String or buffer containing the certificate private key we wish to present (需要具有支持 ssl 的，2.4 或更高版本的 mongod 服务器)。

- `sslPass` - 包含我们希望提供的证书私钥的字符串或缓冲区 (needs to have a mongod server with ssl support,
  2.4 or higher).

- `autoReconnect` - 出错时重新连接。 默认: `true`.

- `noDelay` - TCP Socket NoDelay 选项. 默认: `true`.

- `keepAlive` - 在 TCP socket 上启动 keepAlive 之前等待的毫秒数。默认: `30000`.

- `connectTimeoutMS` - TCP 连接超时。 默认: `30000`.

- `socketTimeoutMS` - TCP Socket 连接超时。 默认: `360000`.

- `reconnectTries` - 服务器尝试重新连接 #次数. 默认: `30`.

- `reconnectInterval` - 服务器将在重试之间等待 #毫秒 默认: `1000`.

- `ha` - 打开高可用性监控。默认: `true`.

- `haInterval` - 每次复制状态检查之间的时间。 默认: `10000,5000`.

- `replicaSet` - 要连接的 replicaset 的名称。

- `acceptableLatencyMS` - 设置使用 NEAREST 时要选择的服务器范围（最低 ping ms +延迟时间范围，例如：范围为 1 到（1 + 15）ms）。默认值：15。

- `secondaryAcceptableLatencyMS` - 设置使用 NEAREST 时要选择的服务器范围（最低 ping ms +延迟时间范围，例如：范围为 1 到（1 + 15）ms）。默认值：15。

- `connectWithNoPrimary` - 设置驱动程序是否应该连接，即使没有主数据库依然可用。默认: `false`.

- `authSource` - 数据库身份验证是否依赖于另一个 databaseName。

- `w` - The write concern.

- `wtimeout` - The write concern 超时

- `j` - Specify a journal write concern. 默认: `false`.

- `forceServerObjectId` - 强制服务器分配\_id值而不是驱动程序。 默认: `false`.

- `serializeFunctions` - 序列化任何对象上的函数。 默认: `false`.

- `ignoreUndefined` - 指定BSON序列化程序是否应忽略未定义的字段。 默认: `false`.

- `raw` - 将文档结果作为原始BSON缓冲区返回。 默认: `false`.

- `promoteLongs` - 如果Long值适合53位分辨率，则将其提升为数字。默认: `true`.

- `promoteBuffers` - 将二进制BSON值提升为native Node Buffers。默认: `false`.

- `promoteValues` - 在可能的情况下将BSON值提升为native类型，设置为false以仅接收wrapper类型。默认: `true`.

- `domainsEnabled` - 启用当前域中回调的包装，默认情况下禁用以避免执行命中。 默认: `false`.

- `bufferMaxEntries` - 设置一个限制，在放弃获得有效连接之前，驱动程序将缓冲多少个操作，默认为-1标识无限制。

- `readPreference` - 首选read偏好:

  - `ReadPreference.PRIMARY`
  - `ReadPreference.PRIMARY_PREFERRED`
  - `ReadPreference.SECONDARY`
  - `ReadPreference.SECONDARY_PREFERRED`
  - `ReadPreference.NEAREST`

- `pkFactory` - 用于生成自定义\_id键的主键工厂对象。

- `promiseLibrary` - 应用程序希望使用的Promise库类如Bluebird，必须与ES6兼容。

- `readConcern` - 指定集合的​​读取问题。 （仅支持MongoDB 3.2或更高版本）。

- `maxStalenessSeconds` - 为辅助读取指定maxStalenessSeconds值，最小值为90秒。

- `appname` - 创建此MongoClient实例的应用程序的名称。 MongoDB 3.4及更新版将在建立每个连接时在服务器日志中打印此值。它还记录在慢查询日志和概要文件集合中。

- `loggerLevel` - 指定驱动程序记录器使用的日志级别 (`error/warn/info/debug`)。

- `logger` - 指定客户记录器机制，可用于使用你的应用程序级别记录器进行记录。

- `authMechanism` - 设置MongoDB用于验证连接的身份验证机制。 

> 注： 由于译者对MongoDB理解不够深入，故一些翻译直接使用了机翻，因此会有些词不达意，如有更好的翻译选项，请提交PR进行完善。

## `sql.js`

- `database`: 应导入的原始 UInt8Array 数据库。

- `sqlJsConfig`: sql.js可选启动配置

- `autoSave`: 是否应禁用 autoSave。如果设置为 true，则在发生更改并指定`location`时，数据库将保存到给定的文件位置（Node.js）或 LocalStorage（浏览器）。否则可以使用`autoSaveCallback`。

- `autoSaveCallback`: 在对数据库进行更改并启用`autoSave`时调用的函数。该函数获取表示数据库的`UInt8Array`。

- `location`: 要加载和保存数据库的文件位置。

- `useLocalForage`: 允许使用localforage库(https://github.com/localForage/localForage)从indexedDB异步保存和加载数据库，而不是在浏览器环境中使用synchron本地存储方法。 需要将localforage模块添加到项目中，并且应在页面中导入localforage.js。

## `expo`

- `database` - 数据库名， 例如 "mydb".
- `driver` - Expo SQLite 模块. 例如，`require('expo-sqlite')`.

## 连接选项示例

以下是 mysql 连接选项的一个小例子：

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
    ],
    cli: {
        entitiesDir: "entity",
        migrationsDir: "migration",
        subscribersDir: "subscriber"
    }
}
```
