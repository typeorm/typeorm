# MySQL / MariaDB

MySQL, MariaDB and Amazon Aurora MySQL are supported as TypeORM drivers.

## Installation

Either `mysql` or `mysql2` are required to connect to a MySQL/MariaDB data source. Only `mysql2` can connect to MySQL 8.0 or later and is recommended because it is still maintained. See more about [mysql2](https://sidorares.github.io/node-mysql2/docs/history-and-why-mysq2).

```shell
npm install mysql
```

or:

```shell
npm install mysql2
```

## Data Source Options

See [Data Source Options](../data-source/2-data-source-options.md) for the common data source options. You can use the data source types `mysql`, `mariadb` and `aurora-mysql` to connect to the respective databases.

-   `connectorPackage` - The database client, either `mysql` or `mysql2`. If the specified client cannot be loaded, it will fall back to the alternative. (Current default: `mysql`)
-   `url` - Connection url where the connection is performed. Please note that other data source options will override parameters set from url.

-   `host` - Database host.

-   `port` - Database host port. Default mysql port is `3306`.

-   `username` - Database username.

-   `password` - Database password.

-   `database` - Database name.

-   `charset` - The charset for the connection. This is called "collation" in the SQL-level of MySQL
    (like utf8_general_ci). If an SQL-level charset is specified (like utf8mb4), then the default collation for that charset is used. (Default: `UTF8_GENERAL_CI`).

-   `timezone` - the timezone configured on the MySQL server. This is used to typecast server date/time
    values to JavaScript Date object and vice versa. This can be `local`, `Z`, or an offset in the form
    `+HH:MM` or `-HH:MM`. (Default: `local`)

-   `connectTimeout` - The milliseconds before a timeout occurs during the initial connection to the MySQL server.
    (Default: `10000`)

-   `acquireTimeout` - The milliseconds before a timeout occurs during the initial connection to the MySQL server. It differs from `connectTimeout` as it governs the TCP connection timeout whereas connectTimeout does not. (default: `10000`)

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

-   `legacySpatialSupport` - Use legacy spatial functions like `GeomFromText` and `AsText` which have been replaced by the standard-compliant `ST_GeomFromText` or `ST_AsText` in MySQL 8.0. (Current default: true)

-   `flags` - List of connection flags to use other than the default ones. It is also possible to blacklist default ones.
    For more information, check [Connection Flags](https://github.com/mysqljs/mysql#connection-flags).

-   `ssl` - object with SSL parameters or a string containing the name of the SSL profile.
    See [SSL options](https://github.com/mysqljs/mysql#ssl-options).

-   `enableQueryTimeout` - If a value is specified for maxQueryExecutionTime, in addition to generating a warning log when a query exceeds this time limit, the specified maxQueryExecutionTime value is also used as the timeout for the query. For more information, check [mysql timeouts](https://github.com/mysqljs/mysql#timeouts).

Additional options can be added to the `extra` object and will be passed directly to the client library. See more in the [mysql connection options](https://github.com/mysqljs/mysql#connection-options) or the [mysql2 documentation](https://sidorares.github.io/node-mysql2/docs).

## Column Types

`bit`, `int`, `integer`, `tinyint`, `smallint`, `mediumint`, `bigint`, `float`, `double`, `double precision`, `dec`, `decimal`, `numeric`, `fixed`, `bool`, `boolean`, `date`, `datetime`, `timestamp`, `time`, `year`, `char`, `nchar`, `national char`, `varchar`, `nvarchar`, `national varchar`, `text`, `tinytext`, `mediumtext`, `blob`, `longtext`, `tinyblob`, `mediumblob`, `longblob`, `enum`, `set`, `json`, `binary`, `varbinary`, `geometry`, `point`, `linestring`, `polygon`, `multipoint`, `multilinestring`, `multipolygon`, `geometrycollection`, `uuid`, `inet4`, `inet6`

> Note: `uuid`, `inet4`, and `inet6` are only available for MariaDB and for the respective versions that made them available.

### `enum` column type

See [enum column type](../entity/1-entities.md#enum-column-type).

### `set` column type

`set` column type is supported by `mariadb` and `mysql`. There are various possible column definitions:

Using TypeScript enums:

```typescript
export enum UserRole {
    ADMIN = "admin",
    EDITOR = "editor",
    GHOST = "ghost",
}

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column({
        type: "set",
        enum: UserRole,
        default: [UserRole.GHOST, UserRole.EDITOR],
    })
    roles: UserRole[]
}
```

Using an array with `set` values:

```typescript
export type UserRoleType = "admin" | "editor" | "ghost"

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column({
        type: "set",
        enum: ["admin", "editor", "ghost"],
        default: ["ghost", "editor"],
    })
    roles: UserRoleType[]
}
```
