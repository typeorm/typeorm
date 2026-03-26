# Vendure (`minor` branch)

- **Repository**: https://github.com/vendure-ecommerce/vendure
- **Branch**: `minor`
- **Commit**: `52f8f45dc`
- **TypeORM version**: `^0.3.21` (in `packages/core`)
- **Date**: 2026-03-26

## Run command

```bash
npx @typeorm/codemod v1 --dry --ignore '**/generated*' .
```

**Note:** Vendure's `e2e/graphql/generated-e2e-admin-types.ts` (42k lines) and `generated-e2e-shop-types.ts` (11k lines) are auto-generated GraphQL types that contain no TypeORM code. Excluding them with `--ignore '**/generated*'` significantly reduces run time.

## Analysis

81 files transformed across 2,818 files with zero parse errors. Clean run — the Babel `constructor`-as-property bug that caused 2 parse errors in previous runs no longer occurs (files likely updated on `minor`).

### Transforms

- `find-options-string-relations` (60 files) — correctly converting string array relations to object syntax
- `connection-to-datasource` (14 files) — correctly renaming typed QueryRunner/EntityManager `.connection` references
- `datasource-sqlite-type` (3 files) — correct (1 is a test fixture false positive)
- `global-functions` (2 files) — flagging deprecated API calls in migration utilities
- `datasource-sqlite-options` (2 files) — correct
- `find-options-string-select` (2 files) — correct

### Not transformed (correct)

- `TransactionalConnection` wrapper class — `this.connection` accesses left untouched (not a TypeORM type)
- NestJS `app.close()` — not renamed to `.destroy()`
- Service-level `.findByIds(ctx, ids)` — not transformed (not a TypeORM repository method)

### Dependency changes

Removed `sqlite3` (better-sqlite3 already present), bumped `better-sqlite3`, `mysql2`, and `typeorm`. Dotenv warning emitted.

## Output

```
Statistics:
  Files processed:   2818
  Files transformed: 81
  Files skipped:     2737
  Parse errors:      0
  Time elapsed:      2m 51s
Transforms applied:
  find-options-string-relations                 60 files
  connection-to-datasource                      14 files
  datasource-sqlite-type                        3 files
  global-functions                              2 files
  datasource-sqlite-options                     2 files
  find-options-string-select                    2 files
  Files requiring manual review:
    global-functions:
      packages/core/src/migrate.ts
      packages/testing/src/data-population/clear-all-tables.ts
Dependency changes:
  devDependencies: removed sqlite3 (better-sqlite3 already present)
  devDependencies: bumped better-sqlite3 from ^11.6.0 to ^12.8.0
  devDependencies: bumped mysql2 from ^3.15.0 to ^3.20.0 (2 times)
  dependencies: bumped typeorm from ^0.3.21 to ^1.0.0-beta.1
  Warnings:
    dotenv detected — TypeORM no longer auto-loads .env files. Make sure your database configuration is defined explicitly using DataSource.
Tip: run your project's formatter (e.g. prettier, eslint --fix) to clean up any style differences introduced by the codemod.
See the full migration guide for details: https://typeorm.io/docs/guides/migration-v1
```
