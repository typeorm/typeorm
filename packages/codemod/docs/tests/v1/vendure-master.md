# Vendure

- **Repository**: https://github.com/vendure-ecommerce/vendure
- **Branch**: `master`
- **Commit**: `4f10785`
- **TypeORM version**: `^0.3.21`
- **Date**: 2026-03-26

## Run command

```bash
npx @typeorm/codemod v1 --dry --ignore '**/generated*' .
```

## Analysis

77 files transformed across 2,683 files with zero parse errors. Vendure is a headless e-commerce framework and the most thoroughly analyzed project in our test suite.

### Transforms

- `find-options-string-relations` (59 files) — correctly converting string array relations to object syntax
- `connection-to-datasource` (13 files) — correctly renaming typed QueryRunner/EntityManager `.connection` references
- `datasource-sqlite-options` (2 files) — correct
- `global-functions` (2 files) — flagging deprecated API calls in migration utilities
- `datasource-sqlite-type` (2 files) — correct (1 is a test fixture false positive)
- `find-options-string-select` (1 file) — correct

### Dependency changes

Removed `sqlite3` (better-sqlite3 already present), bumped `better-sqlite3`, `mysql2`, and `typeorm`. Node.js engine and dotenv warnings emitted.

## Output

```
Statistics:
  Files processed:   2683
  Files transformed: 77
  Files skipped:     2606
  Parse errors:      0
  Time elapsed:      1m 42s
Transforms applied:
  find-options-string-relations                 59 files
  connection-to-datasource                      13 files
  datasource-sqlite-options                     2 files
  global-functions                              2 files
  datasource-sqlite-type                        2 files
  find-options-string-select                    1 file
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
    engines.node is >= 18 — TypeORM requires Node.js 20.0.0+. Update your engines field.
    dotenv detected — TypeORM no longer auto-loads .env files. Make sure your database configuration is defined explicitly using DataSource.
Tip: run your project's formatter (e.g. prettier, eslint --fix) to clean up any style differences introduced by the codemod.
See the full migration guide for details: https://typeorm.io/docs/guides/migration-v1
```
