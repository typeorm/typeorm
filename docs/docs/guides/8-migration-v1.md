# Migration to v1

## Dependencies

The lowest JavaScript version supported is now ES2023, which means Node 20 and later is supported. If you are using a platform that does not support ES2023, please upgrade.

TypeORM requires newer versions of the database client libraries.

Glob patterns are now handled by `tinyglobby` instead of `glob`. While `tinyglobby` is almost a drop-in replacement for `glob`, there might be certain cases in which the behavior is different.

## MySQL / MariaDB

The `connectorPackage` option was removed, together with the support for the old `mysql` client. The only database client supported is now `mysql2`, which TypeORM will try to load by default. If you were using `mysql` in your project, simply replace it with `mysql2`.

## Expo

Support for the legacy Expo SQLite driver has been removed. The legacy API was removed by Expo in SDK v52, so you'll need to use Expo SDK v52 or later with the modern async SQLite API.

## Hashing

Historically TypeORM used a non-standard SHA-1 implementation for hashing. This has been changed to use the built-in `crypto` module from Node.js.

For browser environments `RandomGenerator.sha1` was fixed to the standard implementation.

## Removed deprecations

### `Connection` vs `DataSource`

`DataSource` replaced `Connection` in v0.3 to provide a better meaning to the abstract concept represented by this class. For backwards compatibility, `Connection` was kept as an alias to `DataSource`, now this alias was removed. Similarly, `ConnectionOptions` is now `DataSourceOptions`.

In addition, the old method names of the `DataSource` class have been removed, so `Connection.connect()` is now only `DataSource.initialize()`, `Connection.close()` is `DataSource.destroy()` etc.
