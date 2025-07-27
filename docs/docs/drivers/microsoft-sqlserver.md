# Microsoft SQLServer

## Installation

```shell
npm install mssql
```

## Data Source Options

See [Data Source Options](../data-source/2-data-source-options.md) for the common data source options.

Based on [tedious](https://tediousjs.github.io/node-mssql/) MSSQL implementation. See [SqlServerConnectionOptions.ts](https://github.com/typeorm/typeorm/tree/master/src/driver/sqlserver/SqlServerConnectionOptions.ts) for details on exposed attributes.

-   `url` - Connection url where the connection is performed. Please note that other data source options will override parameters set from url.

-   `host` - Database host.

-   `port` - Database host port. Default mssql port is `1433`.

-   `username` - Database username.

-   `password` - Database password.

-   `database` - Database name.

-   `schema` - Schema name. Default is "dbo".

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

-   `pool.errorHandler` - A function that gets called when the underlying pool emits `'error'` event. Takes a single parameter (error instance) and defaults to logging with `warn` level.

-   `options.fallbackToDefaultDb` - By default, if the database requested by `options.database` cannot be accessed, the connection will fail with an error. However, if `options.fallbackToDefaultDb` is set to `true`, then the user's default database will be used instead (Default: `false`).

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

-   `options.encrypt` - A boolean determining whether the connection will be encrypted. Set to true if you're on Windows Azure. (default: `true`).

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

## Column Types

`int`, `bigint`, `bit`, `decimal`, `money`, `numeric`, `smallint`, `smallmoney`, `tinyint`, `float`, `real`, `date`, `datetime2`, `datetime`, `datetimeoffset`, `smalldatetime`, `time`, `char`, `varchar`, `text`, `nchar`, `nvarchar`, `ntext`, `binary`, `image`, `varbinary`, `hierarchyid`, `sql_variant`, `timestamp`, `uniqueidentifier`, `xml`, `geometry`, `geography`, `rowversion`
