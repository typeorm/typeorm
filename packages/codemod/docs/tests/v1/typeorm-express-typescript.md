# TypeORM Express Typescript

- **Repository**: https://github.com/nicktaras/typeorm-express-typescript
- **Branch**: `main`
- **Commit**: `117f664`
- **TypeORM version**: `^0.2.45`
- **Date**: 2026-03-25

## Run command

```bash
npx @typeorm/codemod v1 --dry --ignore '**/generated*' .
```

## Analysis

16 out of 46 files transformed — a TypeORM Express boilerplate using v0.2.45. The highest transform ratio (35%) of any project, reflecting heavy use of deprecated v0.2 patterns.

### Transforms

- `global-functions` (13 files) — pervasive use of `getRepository()`, `getConnection()`, `createConnection()` across controllers, middleware, tests, and seeds
- `connection-to-datasource` (6 files) — correctly renaming Connection types
- `find-options-string-select` (2 files) — correct
- `datasource-sqlite-options` (1 file) — correct

### Dependency changes

TypeORM bumped from `^0.2.45` to `^1.0.0-beta.1`. Dotenv warning emitted.

## Output

```
✔ Updated one package.json file (0.0s)
Statistics:
  Files processed:   46
  Files transformed: 16
  Files skipped:     30
  Parse errors:      0
  Time elapsed:      3.8s
Transforms applied:
  global-functions                              13 files
  connection-to-datasource                      6 files
  find-options-string-select                    2 files
  datasource-sqlite-options                     1 file
  Files requiring manual review:
    global-functions:
      src/controllers/users/show.ts
      src/controllers/auth/changePassword.ts
      src/controllers/auth/login.test.ts
      src/orm/dbCreateConnection.ts
      src/middleware/validation/users/validatorEdit.ts
      src/controllers/auth/register.test.ts
      src/orm/seeds/1590519635401-SeedUsers.ts
      src/controllers/auth/register.ts
      src/controllers/users/destroy.ts
      src/controllers/auth/login.ts
      src/controllers/users/edit.ts
      src/controllers/users/index.test.ts
      src/controllers/users/list.ts
Dependency changes:
  dependencies: bumped typeorm from ^0.2.45 to ^1.0.0-beta.1
  Warnings:
    dotenv detected — TypeORM no longer auto-loads .env files. Make sure your database configuration is defined explicitly using DataSource.
Tip: run your project's formatter (e.g. prettier, eslint --fix) to clean up any style differences introduced by the codemod.
See the full migration guide for details: https://typeorm.io/docs/guides/migration-v1
```
