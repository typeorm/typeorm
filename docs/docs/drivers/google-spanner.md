# Google Spanner

## Installation

```shell
npm install @google-cloud/spanner
```

## Data Source Options

See [Data Source Options](../data-source/2-data-source-options.md) for the common data source options.

Provide authentication credentials to your application code
by setting the environment variable `GOOGLE_APPLICATION_CREDENTIALS`:

```shell
# Linux/macOS
export GOOGLE_APPLICATION_CREDENTIALS="KEY_PATH"

# Windows
set GOOGLE_APPLICATION_CREDENTIALS=KEY_PATH

# Replace KEY_PATH with the path of the JSON file that contains your service account key.
```

To use Spanner with the emulator you should set `SPANNER_EMULATOR_HOST` environment variable:

```shell
# Linux/macOS
export SPANNER_EMULATOR_HOST=localhost:9010

# Windows
set SPANNER_EMULATOR_HOST=localhost:9010
```

## Column Types

Column types of the `spanner` driver (GoogleSQL dialect):

`bool`, `int64`, `float64`, `numeric`, `string`, `json`, `bytes`, `date`, `timestamp`, `array`

For databases created with the PostgreSQL dialect, use the `spanner-postgres` data source type, described in [PostgreSQL dialect (`spanner-postgres`)](#postgresql-dialect-spanner-postgres).

## PostgreSQL dialect (`spanner-postgres`)

Use the `spanner-postgres` data source type for a Spanner database created with the PostgreSQL dialect. The `spanner` type supports the GoogleSQL dialect only. The installation, credentials and emulator settings above apply to both.

```typescript
import { DataSource } from "typeorm"

const dataSource = new DataSource({
    type: "spanner-postgres",
    projectId: "my-project",
    instanceId: "my-instance",
    databaseId: "my-database",
    entities: [User],
})

await dataSource.initialize()
```

### Data Source Options

See [Data Source Options](../data-source/2-data-source-options.md) for the common data source options. The connection options are the same as for `spanner`:

- `projectId` - Google Cloud project of the database.
- `instanceId` - Spanner instance of the database.
- `databaseId` - Spanner database.
- `credentials` - Optional object with the `client_email` and `private_key` of a service account.
- `schema` - Schema name. Defaults to `public`.
- `parseInt8` - A boolean, `false` by default. `bigint` (`int8`) columns are read as strings, as in the `postgres` driver. Set it to `true` to read them as JavaScript numbers. Values above `Number.MAX_SAFE_INTEGER` (`2^53 - 1`) lose precision. Columns declared as `int`, `integer` or a JavaScript `Number` property are always read as numbers.

### Emulator

Create the database with the PostgreSQL dialect. The Admin API call needs both `databaseDialect` and `createStatement`: without `createStatement`, the client sends a GoogleSQL-quoted `CREATE DATABASE`, which fails.

```typescript
import { Spanner } from "@google-cloud/spanner"

const spanner = new Spanner({ projectId: "my-project" })
const [, operation] = await spanner
    .instance("my-instance")
    .createDatabase("my-database", {
        databaseDialect: "POSTGRESQL",
        createStatement: 'CREATE DATABASE "my-database"',
    })
await operation.promise()
```

### Column Types for `spanner-postgres`

| Column type                                                                   | Spanner type               |
| ----------------------------------------------------------------------------- | -------------------------- |
| `bool`, `boolean`                                                             | `boolean`                  |
| `int`, `integer`, `int8`, `bigint`, `Number`                                  | `bigint`                   |
| `float`, `float8`, `double precision`                                         | `double precision`         |
| `float4`, `real`                                                              | `real`                     |
| `numeric`, `decimal`                                                          | `numeric`                  |
| `varchar`, `character varying`, `text`, `uuid`, `simple-array`, `simple-json` | `character varying`        |
| `timestamptz`, `timestamp with time zone`                                     | `timestamp with time zone` |
| `date`                                                                        | `date`                     |
| `bytea`                                                                       | `bytea`                    |
| `jsonb`                                                                       | `jsonb`                    |

- `varchar` and `character varying` accept a length. `text`, `simple-array` and `simple-json` have no length. `uuid` is stored as `varchar(36)`.
- The precision and scale of `numeric` are not written to the DDL.
- Any other column type fails when the data source initializes, with `DataTypeNotSupportedError`. Among the common ones, `int2`, `smallint`, `timestamp` (without time zone), `char`, `json`, `interval`, `enum` and `simple-enum` are not supported.

### Generated Columns

- `@PrimaryGeneratedColumn("uuid")` is supported. The default value is `spanner.generate_uuid()`.
- `increment` and `identity` generate a `bigint GENERATED BY DEFAULT AS IDENTITY (BIT_REVERSED_POSITIVE)` column. The values are unique and positive, but not sequential, and can be larger than `Number.MAX_SAFE_INTEGER`. Declare the column as `bigint`, which reads the value as a string:

```typescript
@PrimaryGeneratedColumn({ type: "bigint" })
id: string
```

A column declared as `int`, or the default `Number` type of `@PrimaryGeneratedColumn()`, throws a `TypeORMError` when it reads a generated value above `Number.MAX_SAFE_INTEGER`.

- Computed columns (`asExpression`, `generatedType`) are not supported.

### Schema Changes

The driver queues DDL statements and sends them to Spanner together, in one schema update. This is why `synchronize()` and migrations are much faster than with one request per statement. The queue is sent before:

- a statement that is not DDL runs, or the schema is read;
- a transaction starts or commits;
- a migration ends, or the query runner is released;
- `queryRunner.flushDdl()` is called.

A rollback discards the statements queued in the transaction. Spanner DDL is not transactional, so statements that were already sent are not undone. A DDL error is thrown by the call that sends the queue, which can be later than the call that queued the statement. Call `flushDdl()` to get the errors at a given point.

### Schema Limits

- Unique constraints are created as unique indexes.
- Foreign keys support `onDelete` `CASCADE` or `NO ACTION`, `onUpdate` `NO ACTION` only, and cannot be `deferrable`.
- `changeColumn` can change the length, nullability, default and unique flag. It throws when the type, the primary key or the name changes. `renameColumn` is not supported.
- The primary key of an existing table cannot be added, removed or changed, and every table needs a primary key.
- Views are not supported.
- `createDatabase`, `dropDatabase` and `hasDatabase` throw. Manage databases with the Spanner Admin API.
- Table names cannot contain hyphens. The query result cache table is therefore named `query_result_cache`.
- Identifiers are limited to 63 characters, and longer names are truncated without an error, as in PostgreSQL. The names TypeORM generates fit, but an explicit table, column or index name longer than 63 characters is truncated, and `synchronize()` then sees a difference on every run.

### Transactions

- Supported isolation levels are `SERIALIZABLE` and `REPEATABLE READ`. Other levels throw.
- Nested transactions throw `TransactionAlreadyStartedError`, because Spanner has no savepoints.
- `setLock("pessimistic_write")` (`FOR UPDATE`) is supported. `pessimistic_read` is not supported. `setOnLocked("nowait")` and `setOnLocked("skip_locked")` throw.

### Upsert and `orIgnore()`

Spanner accepts `ON CONFLICT` only on the primary key:

- `orIgnore()` generates `ON CONFLICT (<primary key>) DO NOTHING`.
- A conflict target other than the primary key, `ON CONSTRAINT`, or a `WHERE` clause in the update throws a `TypeORMError`.
- `orUpdate` must overwrite every inserted column, except the primary key and the update date columns, and must not overwrite a column that is not inserted.

### Migrations

Run migrations with `migrationsTransactionMode: "none"`. With `"all"` the Spanner emulator rejects schema changes that run inside a read-write transaction with writes, when there are two or more migrations.

`undoLastMigration()` uses `"all"` by default and ignores `migrationsTransactionMode`, so pass `{ transaction: "none" }`. Migrations are ordered by `timestamp`, because the generated ids are not sequential.

```typescript
const dataSource = new DataSource({
    type: "spanner-postgres",
    projectId: "my-project",
    instanceId: "my-instance",
    databaseId: "my-database",
    migrationsTransactionMode: "none",
})

await dataSource.runMigrations()
await dataSource.undoLastMigration({ transaction: "none" })
```

### Parameters and Large Inserts

A statement accepts at most 950 parameters. A multi-row `insert()` that exceeds the limit is split into several statements, which run in one transaction. The driver does not split `IN (...)` lists, so keep them below 950 values.
