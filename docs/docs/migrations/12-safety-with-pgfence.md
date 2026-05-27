# Analyzing migration safety

TypeORM migrations are plain SQL inside `queryRunner.query()` calls. Some of
the SQL these migrations issue can lock a production table under
`ACCESS EXCLUSIVE` for the duration of a rewrite, for example `ADD COLUMN`
with `NOT NULL` and no `DEFAULT`, or `CREATE INDEX` without `CONCURRENTLY`.

[pgfence](https://pgfence.com) is an open-source CLI that parses TypeORM
migration files, extracts the SQL from each `queryRunner.query()` call, and
reports the Postgres lock mode each statement acquires, the risk level, and
the safe rewrite for any pattern that locks the table.

## Usage

```shell
npx @flvmnt/pgfence analyze src/migrations/*.ts
```

The TypeORM format is auto-detected by file content. Statements built from
template literals or computed identifiers are reported as `UNKNOWN` (counted
in the coverage summary) rather than skipped silently.

To explain a single statement:

```shell
npx @flvmnt/pgfence explain "ALTER TABLE \"user\" ALTER COLUMN \"email\" TYPE text"
```

See the [pgfence documentation](https://pgfence.com) for risk levels, safe
rewrite recipes, CI integration, and database-size aware scoring.
