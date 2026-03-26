# Foal

- **Repository**: https://github.com/FoalTS/foal
- **Branch**: `master`
- **Commit**: `0c943e5`
- **TypeORM version**: `0.3.27`
- **Date**: 2026-03-26

## Run command

```bash
npx @typeorm/codemod v1 --dry .
```

## Analysis

8 files transformed across 658 files. FoalTS is a full-featured Node.js framework with its own TypeORM integration.

### Transforms

- `mongodb-types` (5 files) — correctly moves `ObjectId` imports from `typeorm` to `mongodb`
- `connection-to-datasource` (1 file) — correct
- `datasource-sqlite-type` (1 file) — correct
- `datasource-name` (1 file) — correct

### Parse errors

11 files failed — all are CLI template files with placeholder syntax (e.g. `class /* className */`) that Babel cannot parse. These are code generators, not runtime TypeORM code.

### Dependency changes

Replaced `sqlite3` with `better-sqlite3` in 3 packages. Bumped `mongodb`, `redis`, replaced `mysql` with `mysql2`.

## Output

```
Statistics:
  Files processed:   658
  Files transformed: 8
  Files skipped:     639
  Parse errors:      11
  Time elapsed:      17.2s
Transforms applied:
  mongodb-types                                 5 files
  connection-to-datasource                      1 file
  datasource-sqlite-type                        1 file
  datasource-name                               1 file
  Parse errors:
    packages/cli/templates/entity/entity.mongodb.ts A class name is required. (5:39)
    packages/cli/templates/entity/entity.ts A class name is required. (5:39)
    packages/cli/templates/hook/hook.ts Unexpected token (3:41)
    packages/cli/templates/rest-api/controllers/controller.auth.ts Unexpected token (8:34)
    packages/cli/templates/rest-api/controllers/controller.spec.auth.ts Unexpected token (13:34)
    packages/cli/templates/rest-api/controllers/controller.spec.ts Unexpected reserved word 'let'. (21:2)
    packages/cli/templates/rest-api/controllers/controller.ts Unexpected token, expected "(" (33:37)
    packages/cli/templates/rest-api/entities/entity.auth.ts A class name is required. (6:39)
    packages/cli/templates/rest-api/entities/entity.ts A class name is required. (4:39)
    packages/cli/templates/service/service.empty.ts A class name is required. (1:39)
    packages/swagger/src/main.tpl.js Unexpected token (4:4)
Dependency changes:
  dependencies: replaced sqlite3 with better-sqlite3@^12.8.0 (3 times)
  dependencies: bumped typeorm from 0.3.27 to ^1.0.0-beta.1 (5 times)
  dependencies: bumped mongodb from ~5.9.2 to ^7.1.1 (3 times)
  dependencies: bumped redis from ~4.7.0 to ^5.11.0 (3 times)
  devDependencies: bumped redis from ~4.7.0 to ^5.11.0
  devDependencies: replaced mysql with mysql2@^3.20.0
  devDependencies: replaced sqlite3 with better-sqlite3@^12.8.0
  devDependencies: bumped mongodb from ~5.9.2 to ^7.1.1
  devDependencies: bumped typeorm from 0.3.27 to ^1.0.0-beta.1
  peerDependencies: bumped typeorm from ^0.3.24 to ^1.0.0-beta.1
Tip: run your project's formatter (e.g. prettier, eslint --fix) to clean up any style differences introduced by the codemod.
See the full migration guide for details: https://typeorm.io/docs/guides/migration-v1
```
