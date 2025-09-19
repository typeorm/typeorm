# Oracle

## Installation

```shell
npm install oracledb
```

By default, the [oracledb](https://github.com/oracle/node-oracledb) uses the "thin mode" to connect. To enable the "thick mode", you need to follow the installation instructions from
their [user guide](https://node-oracledb.readthedocs.io/en/latest/user_guide/installation.html).

## Data Source Options

See [Data Source Options](../data-source/2-data-source-options.md) for the common data source options.

-   `sid` - The System Identifier (SID) identifies a specific database instance. For example, "sales".
-   `serviceName` - The Service Name is an identifier of a database service. For example, `sales.us.example.com`.

## Column Types

`char`, `nchar`, `nvarchar2`, `varchar2`, `long`, `raw`, `long raw`, `number`, `numeric`, `float`, `dec`, `decimal`, `integer`, `int`, `smallint`, `real`, `double precision`, `date`, `timestamp`, `timestamp with time zone`, `timestamp with local time zone`, `interval year to month`, `interval day to second`, `bfile`, `blob`, `clob`, `nclob`, `rowid`, `urowid`
