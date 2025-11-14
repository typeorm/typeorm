# Postgres / CockroachDB

PostgreSQL, CockroachDB and Amazon Aurora Postgres are supported as TypeORM drivers.

Databases that are PostgreSQL-compatible can also be used with TypeORM via the `postgres` data source type.

To use YugabyteDB, refer to [their ORM docs](https://docs.yugabyte.com/stable/drivers-orms/nodejs/typeorm/) to get started. Note that because some Postgres features are [not supported](https://docs.yugabyte.com/stable/develop/postgresql-compatibility/#unsupported-postgresql-features) by YugabyteDB, some TypeORM functionality may be limited.

## Installation

```shell
npm install pg
```

For streaming support:

```shell
npm install pg-query-stream
```

## Data Source Options

See [Data Source Options](../data-source/2-data-source-options.md) for the common data source options. You can use the data source type `postgres`, `cockroachdb` or `aurora-postgres` to connect to the respective databases.

-   `url` - Connection url where the connection is performed. Please note that other data source options will override parameters set from url.

-   `host` - Database host.

-   `port` - Database host port. The default Postgres port is `5432`.

-   `username` - Database username.

-   `password` - Database password.

-   `database` - Database name.

-   `schema` - Schema name. Default is "public".

-   `connectTimeoutMS` - The milliseconds before a timeout occurs during the initial connection to the postgres server. If `undefined`, or set to `0`, there is no timeout. Defaults to `undefined`.

-   `ssl` - Object with ssl parameters. See [TLS/SSL](https://node-postgres.com/features/ssl).

-   `uuidExtension` - The Postgres extension to use when generating UUIDs. Defaults to `uuid-ossp`. It can be changed to `pgcrypto` if the `uuid-ossp` extension is unavailable.

-   `poolErrorHandler` - A function that gets called when the underlying pool emits `'error'` event. Takes a single parameter (error instance) and defaults to logging with `warn` level.

-   `maxTransactionRetries` - A maximum number of transaction retries in case of a 40001 error. Defaults to 5.

-   `logNotifications` - A boolean to determine whether postgres server [notice messages](https://www.postgresql.org/docs/current/plpgsql-errors-and-messages.html) and [notification events](https://www.postgresql.org/docs/current/sql-notify.html) should be included in client's logs with `info` level (default: `false`).

-   `installExtensions` - A boolean to control whether to install necessary postgres extensions automatically or not (default: `true`)

-   `applicationName` - A string visible in statistics and logs to help referencing an application to a connection (default: `undefined`)

-   `parseInt8` - A boolean to enable parsing 64-bit integers (int8) as JavaScript numbers. By default, `int8` (bigint) values are returned as strings to avoid overflows. JavaScript numbers are IEEE-754 and lose precision over the maximum safe integer (`Number.MAX_SAFE_INTEGER = +2^53`). If you require the full 64-bit range consider working with the returned strings or converting them to native `bigint` instead of using this option.

Additional options can be added to the `extra` object and will be passed directly to the client library. See more in `pg`'s documentation for [Pool](https://node-postgres.com/apis/pool#new-pool) and [Client](https://node-postgres.com/apis/client#new-client).

## Column Types

### Column types for `postgres`

`int`, `int2`, `int4`, `int8`, `smallint`, `integer`, `bigint`, `decimal`, `numeric`, `real`, `float`, `float4`, `float8`, `double precision`, `money`, `character varying`, `varchar`, `character`, `char`, `text`, `citext`, `hstore`, `bytea`, `bit`, `varbit`, `bit varying`, `timetz`, `timestamptz`, `timestamp`, `timestamp without time zone`, `timestamp with time zone`, `date`, `time`, `time without time zone`, `time with time zone`, `interval`, `bool`, `boolean`, `enum`, `point`, `line`, `lseg`, `box`, `path`, `polygon`, `circle`, `cidr`, `inet`, `macaddr`, `macaddr8`, `tsvector`, `tsquery`, `uuid`, `xml`, `json`, `jsonb`, `jsonpath`, `int4range`, `int8range`, `numrange`, `tsrange`, `tstzrange`, `daterange`, `int4multirange`, `int8multirange`, `nummultirange`, `tsmultirange`, `tstzmultirange`, `multidaterange`, `geometry`, `geography`, `cube`, `ltree`

### Column types for `cockroachdb`

`array`, `bool`, `boolean`, `bytes`, `bytea`, `blob`, `date`, `numeric`, `decimal`, `dec`, `float`, `float4`, `float8`, `double precision`, `real`, `inet`, `int`, `integer`, `int2`, `int8`, `int64`, `smallint`, `bigint`, `interval`, `string`, `character varying`, `character`, `char`, `char varying`, `varchar`, `text`, `time`, `time without time zone`, `timestamp`, `timestamptz`, `timestamp without time zone`, `timestamp with time zone`, `json`, `jsonb`, `uuid`

Note: CockroachDB returns all numeric data types as `string`. However, if you omit the column type and define your property as `number` ORM will `parseInt` string into number.

### Spatial columns

TypeORM's PostgreSQL and CockroachDB support uses [GeoJSON](http://geojson.org/) as an interchange format, so geometry columns should be tagged either as `object` or `Geometry` (or subclasses, e.g. `Point`) after importing [`geojson` types](https://www.npmjs.com/package/@types/geojson) or using the TypeORM built-in GeoJSON types:

```typescript
import {
    Entity,
    PrimaryColumn,
    Column,
    Point,
    LineString,
    MultiPoint
} from "typeorm"

@Entity()
export class Thing {
    @PrimaryColumn()
    id: number

    @Column("geometry")
    point: Point

    @Column("geometry")
    linestring: LineString

    @Column("geometry", {
        spatialFeatureType: "MultiPoint",
        srid: 4326,
    })
    multiPointWithSRID: MultiPoint
}

...

const thing = new Thing()
thing.point = {
    type: "Point",
    coordinates: [116.443987, 39.920843],
}
thing.linestring = {
    type: "LineString",
    coordinates: [
        [-87.623177, 41.881832],
        [-90.199402, 38.627003],
        [-82.446732, 38.413651],
        [-87.623177, 41.881832],
    ],
}
thing.multiPointWithSRID = {
    type: "MultiPoint",
    coordinates: [
        [100.0, 0.0],
        [101.0, 1.0],
    ],
}
```

TypeORM tries to do the right thing, but it's not always possible to determine
when a value being inserted or the result of a PostGIS function should be
treated as a geometry. As a result, you may find yourself writing code similar
to the following, where values are converted into PostGIS `geometry`s from
GeoJSON and into GeoJSON as `json`:

```typescript
import { Point } from "typeorm"

const origin: Point = {
    type: "Point",
    coordinates: [0, 0],
}

await dataSource.manager
    .createQueryBuilder(Thing, "thing")
    // convert stringified GeoJSON into a geometry with an SRID that matches the
    // table specification
    .where(
        "ST_Distance(geom, ST_SetSRID(ST_GeomFromGeoJSON(:origin), ST_SRID(geom))) > 0",
    )
    .orderBy(
        "ST_Distance(geom, ST_SetSRID(ST_GeomFromGeoJSON(:origin), ST_SRID(geom)))",
        "ASC",
    )
    .setParameters({
        // stringify GeoJSON
        origin: JSON.stringify(origin),
    })
    .getMany()

await dataSource.manager
    .createQueryBuilder(Thing, "thing")
    // convert geometry result into GeoJSON, treated as JSON (so that TypeORM
    // will know to deserialize it)
    .select("ST_AsGeoJSON(ST_Buffer(geom, 0.1))::json geom")
    .from("thing")
    .getMany()
```
