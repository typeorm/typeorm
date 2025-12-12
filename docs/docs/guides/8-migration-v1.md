# Migration to v1

## Dependencies

The lowest JavaScript version supported is now ES2023, which means Node 20 and later is supported. If you are using a platform that does not support ES2023, please upgrade.

TypeORM requires newer versions of the database client libraries.

Glob patterns are now handled by `tinyglobby` instead of `glob`. While `tinyglobby` is almost a drop-in replacement for `glob`, there might be certain cases in which the behavior is different.
