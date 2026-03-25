# NestJSx Crud

- **Repository**: https://github.com/nestjsx/crud
- **Branch**: `master`
- **Commit**: `d6d3c4e`
- **TypeORM version**: `^0.3.0`
- **Date**: 2026-03-25

## Run command

```bash
npx @typeorm/codemod v1 --dry --ignore '**/generated*' .
```

## Analysis

5 files transformed — a CRUD library for NestJS using TypeORM v0.3.0.

### Transforms

- `datasource-mssql-domain` (3 files) — **false positives**: matches `domain` property in test seed data and query param specs, not MSSQL config
- `find-options-string-select` (3 files) — correct

### Dependency changes

Replaced `mysql` with `mysql2`, bumped `redis` from `4.0.4` to `^5.11.0`, TypeORM from `^0.3.0` to `^1.0.0-beta.1`.

## Output

```
✔ Updated 1 out of 5 package.json files (0.0s)
Statistics:
  Files processed:   165
  Files transformed: 5
  Files skipped:     160
  Parse errors:      0
  Time elapsed:      11.1s
Transforms applied:
  datasource-mssql-domain                       3 files
  find-options-string-select                    3 files
  Files requiring manual review:
    datasource-mssql-domain:
      integration/crud-typeorm/seeds.ts
      packages/crud-typeorm/test/b.query-params.spec.ts
      packages/crud-typeorm/test/c.basic-crud.spec.ts
Dependency changes:
  dependencies: replaced mysql with mysql2@^3.20.0
  dependencies: bumped redis from 4.0.4 to ^5.11.0
  dependencies: bumped typeorm from ^0.3.0 to ^1.0.0-beta.1
Tip: run your project's formatter (e.g. prettier, eslint --fix) to clean up any style differences introduced by the codemod.
See the full migration guide for details: https://typeorm.io/docs/guides/migration-v1
```
