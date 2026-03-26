# NestJS Realworld Example App

- **Repository**: https://github.com/lujakob/nestjs-realworld-example-app
- **Branch**: `master`
- **Commit**: `c1c2cc4`
- **TypeORM version**: `^0.2.24`
- **Date**: 2026-03-26

## Run command

```bash
npx @typeorm/codemod v1 --dry .
```

## Analysis

4 files transformed cleanly — a NestJS implementation of the RealWorld spec using TypeORM v0.2.24 (pre-v0.3).

### Transforms

- `connection-to-datasource` (2 files) — correctly renaming Connection type references
- `global-functions` (2 files) — flagging deprecated `getRepository()` calls for manual migration
- `find-options-string-relations` (1 file) — correct

### Dependency changes

Replaced `mysql` with `mysql2`, TypeORM bumped from `^0.2.24` to `^1.0.0-beta.1`.

## Output

```
Statistics:
  Files processed:   71
  Files transformed: 4
  Files skipped:     67
  Parse errors:      0
  Time elapsed:      4.9s
Transforms applied:
  connection-to-datasource                      2 files
  global-functions                              2 files
  find-options-string-relations                 1 file
  Files requiring manual review:
    global-functions:
      src/user/user.service.ts
      src/article/article.service.ts
Dependency changes:
  dependencies: replaced mysql with mysql2@^3.20.0
  dependencies: bumped typeorm from ^0.2.24 to ^1.0.0-beta.1
Tip: run your project's formatter (e.g. prettier, eslint --fix) to clean up any style differences introduced by the codemod.
See the full migration guide for details: https://typeorm.io/docs/guides/migration-v1
```
