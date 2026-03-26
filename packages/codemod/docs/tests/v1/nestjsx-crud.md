# NestJSx Crud

- **Repository**: https://github.com/nestjsx/crud
- **Branch**: `master`
- **Commit**: `d6d3c4e`
- **TypeORM version**: `^0.3.0`
- **Date**: 2026-03-26

## Run command

```bash
npx @typeorm/codemod v1 --dry .
```

## Analysis

4 files transformed — a CRUD library for NestJS using TypeORM v0.3.0.

### Transforms

- `find-options-string-select` (3 files) — correct
- `datasource-mssql-domain` (1 file) — this is a legitimate match in `seeds.ts` which imports from TypeORM

### Dependency changes

Replaced `mysql` with `mysql2`, bumped `redis`, TypeORM from `^0.3.0` to `^1.0.0-beta.1`.

## Output

```
Statistics:
  Files processed:   165
  Files transformed: 4
  Files skipped:     161
  Parse errors:      0
  Time elapsed:      10.3s
Transforms applied:
  find-options-string-select                    3 files
  datasource-mssql-domain                       1 file
  Files requiring manual review:
    datasource-mssql-domain:
      integration/crud-typeorm/seeds.ts
Dependency changes:
  dependencies: replaced mysql with mysql2@^3.20.0
  dependencies: bumped redis from 4.0.4 to ^5.11.0
  dependencies: bumped typeorm from ^0.3.0 to ^1.0.0-beta.1
Tip: run your project's formatter (e.g. prettier, eslint --fix) to clean up any style differences introduced by the codemod.
See the full migration guide for details: https://typeorm.io/docs/guides/migration-v1
```
