# Mili

- **Repository**: https://github.com/nicktaras/mili
- **Branch**: `master`
- **Commit**: `dcac200`
- **TypeORM version**: `0.3.0-rc.2`
- **Date**: 2026-03-25

## Run command

```bash
npx @typeorm/codemod v1 --dry --ignore '**/generated*' .
```

## Analysis

27 files transformed — a Chinese blog platform using TypeORM v0.3.0-rc.2 (very early v0.3 release).

### Transforms

- `find-options-string-select` (12 files) — correctly converting string array select to object syntax
- `find-options-string-relations` (10 files) — correctly converting string array relations
- `global-functions` (8 files) — flagging deprecated API calls across cron jobs, DB scripts, and utilities
- `datasource-mssql-domain` (3 files) — **false positives**: matches `domain` in middleware locals and user controller config, not MSSQL

### Parse errors

2 files — both are minified JavaScript libraries (`simplemde.min.js`, `jquery.min.js`) with `function` keyword issues. Not TypeORM code.

### Dependency changes

Replaced `mysql` with `mysql2`, bumped `ioredis` from `4.14.1` to `^5.10.1`, TypeORM from `0.3.0-rc.2` to `^1.0.0-beta.1`.

## Output

```
✔ Updated 1 out of 2 package.json files (0.0s)
Statistics:
  Files processed:   243
  Files transformed: 27
  Files skipped:     214
  Parse errors:      2
  Time elapsed:      43.0s
Transforms applied:
  find-options-string-select                    12 files
  find-options-string-relations                 10 files
  global-functions                              8 files
  datasource-mssql-domain                       3 files
  datasource-sap                                2 files
  Files requiring manual review:
    global-functions:
      src/cron/user_follower_count.ts
      src/cron/user_article_count.ts
      src/cron/user_liked_count.ts
      src/dbscript/init_db.ts
      src/dbscript/run.ts
      src/dbscript/updateRootCommentCount.ts
      src/dbscript/tables.ts
      src/dbscript/user.ts
    datasource-mssql-domain:
      src/core/middleware/locals.middleware.ts
      src/user/user.controller.ts
      src/config/cfg.default.ts
  Parse errors:
    pc/js/libs/simplemde.min.js Unexpected keyword 'function'. (11:10813)
    pc/js/libs/jqueryx-1.11.3.min.js Unexpected keyword 'function'. (2:545)
Dependency changes:
  dependencies: replaced mysql with mysql2@^3.20.0
  dependencies: bumped ioredis from 4.14.1 to ^5.10.1
  dependencies: bumped typeorm from 0.3.0-rc.2 to ^1.0.0-beta.1
Tip: run your project's formatter (e.g. prettier, eslint --fix) to clean up any style differences introduced by the codemod.
See the full migration guide for details: https://typeorm.io/docs/guides/migration-v1
```
