# Foal

- **Repository**: https://github.com/FoalTS/foal
- **Branch**: `master`
- **Commit**: `0c943e5`
- **TypeORM version**: `0.3.27`
- **Date**: 2026-03-25

## Run command

```bash
npx @typeorm/codemod v1 --dry --ignore '**/generated*' .
```

## Analysis

14 files transformed across 658 files. FoalTS is a full-featured Node.js framework with its own TypeORM integration.

### Transforms

- `datasource-mssql-domain` (6 files) — **false positives**: matches `domain` properties in cookie and session configs, not MSSQL config. Needs TypeORM import scoping.
- `mongodb-types` (5 files) — correctly moves `ObjectId` imports from `typeorm` to `mongodb`
- `connection-to-datasource` (1 file) — correct
- `datasource-name` (1 file) — correct
- `datasource-sqlite-type` (1 file) — correct

### Parse errors

11 files failed — all are CLI template files with placeholder syntax (e.g. `class /* className */`) that Babel cannot parse. These are code generators, not runtime TypeORM code.

### Dependency changes

Replaced `sqlite3` with `better-sqlite3` in 3 packages. Bumped `mongodb` from `~5.9.2` to `^7.1.1`, `redis` from `~4.7.0` to `^5.11.0`, and replaced `mysql` with `mysql2`.

## Output

```
✔ Updated 9 out of 34 package.json files (0.0s)
Statistics:
  Files processed:   658
  Files transformed: 14
  Files skipped:     633
  Parse errors:      11
  Time elapsed:      20.4s
Transforms applied:
  datasource-mssql-domain                       6 files
  mongodb-types                                 5 files
  datasource-sqlite-type                        1 file
  connection-to-datasource                      1 file
  datasource-name                               1 file
  Files requiring manual review:
    datasource-mssql-domain:
      packages/jwt/src/http/remove-auth-cookie.ts
      packages/jwt/src/http/set-auth-cookie.ts
      tests/docs-tests/src/tests/architecture/controllers/returning-a-response.feature.ts
      packages/core/src/core/http/http-responses.spec.ts
      packages/core/src/sessions/http/utils/remove-session-cookie.ts
      packages/core/src/sessions/http/utils/set-session-cookie.ts
  Parse errors:
    packages/cli/templates/entity/entity.ts A class name is required. (5:39)
    packages/cli/templates/entity/entity.mongodb.ts A class name is required. (5:39)
    packages/cli/templates/hook/hook.ts Unexpected token (3:41)
    packages/cli/templates/service/service.empty.ts A class name is required. (1:39)
    packages/swagger/src/main.tpl.js Unexpected token (4:4)
    packages/cli/templates/rest-api/controllers/controller.ts Unexpected token, expected "(" (33:37)
    packages/cli/templates/rest-api/controllers/controller.auth.ts Unexpected token (8:34)
    packages/cli/templates/rest-api/controllers/controller.spec.auth.ts Unexpected token (13:34)
    packages/cli/templates/rest-api/entities/entity.auth.ts A class name is required. (6:39)
    packages/cli/templates/rest-api/controllers/controller.spec.ts Unexpected reserved word 'let'. (21:2)
    packages/cli/templates/rest-api/entities/entity.ts A class name is required. (4:39)
Dependency changes:
  dependencies: replaced sqlite3 with better-sqlite3@^12.8.0
  dependencies: bumped typeorm from 0.3.27 to ^1.0.0-beta.1
  dependencies: replaced sqlite3 with better-sqlite3@^12.8.0
  dependencies: bumped typeorm from 0.3.27 to ^1.0.0-beta.1
  dependencies: replaced sqlite3 with better-sqlite3@^12.8.0
  dependencies: bumped typeorm from 0.3.27 to ^1.0.0-beta.1
  dependencies: bumped mongodb from ~5.9.2 to ^7.1.1
  dependencies: bumped redis from ~4.7.0 to ^5.11.0
  devDependencies: bumped redis from ~4.7.0 to ^5.11.0
  devDependencies: replaced mysql with mysql2@^3.20.0
  devDependencies: replaced sqlite3 with better-sqlite3@^12.8.0
  devDependencies: bumped mongodb from ~5.9.2 to ^7.1.1
  devDependencies: bumped typeorm from 0.3.27 to ^1.0.0-beta.1
  peerDependencies: bumped typeorm from ^0.3.24 to ^1.0.0-beta.1
  dependencies: bumped mongodb from ~5.9.2 to ^7.1.1
  dependencies: bumped redis from ~4.7.0 to ^5.11.0
  dependencies: bumped typeorm from 0.3.27 to ^1.0.0-beta.1
  dependencies: bumped mongodb from ~5.9.2 to ^7.1.1
  dependencies: bumped redis from ~4.7.0 to ^5.11.0
  dependencies: bumped typeorm from 0.3.27 to ^1.0.0-beta.1
Tip: run your project's formatter (e.g. prettier, eslint --fix) to clean up any style differences introduced by the codemod.
See the full migration guide for details: https://typeorm.io/docs/guides/migration-v1
```
