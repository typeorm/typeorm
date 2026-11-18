# Analyzing migration safety

TypeORM migrations can run raw SQL through `queryRunner.query()`. Some DDL
statements hold restrictive PostgreSQL locks: `ALTER COLUMN TYPE` can rewrite
a table under `ACCESS EXCLUSIVE`, while `CREATE INDEX` without `CONCURRENTLY`
blocks writes.

[pgfence](https://pgfence.com) is an open-source CLI that extracts static SQL
from TypeORM migration files, reports lock modes and risk levels, and suggests
safer rewrites when available.

## Usage

```shell
npx --yes @flvmnt/pgfence analyze --format typeorm src/migrations/*.ts
```

Interpolated or dynamic SQL and TypeORM schema-builder calls cannot always be
analyzed. pgfence reports extraction warnings and coverage for these cases
instead of treating them as safe.

To explain a single statement:

```shell
npx --yes @flvmnt/pgfence explain "ALTER TABLE \"user\" ALTER COLUMN \"email\" TYPE text"
```

See the [pgfence documentation](https://pgfence.com) for risk levels, safe
rewrite recipes, CI integration, and database-size aware scoring.
