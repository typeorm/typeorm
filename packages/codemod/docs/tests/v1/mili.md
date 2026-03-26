# Mili

- **Repository**: https://github.com/nicktaras/mili
- **Branch**: `master`
- **Commit**: `dcac200`
- **TypeORM version**: `0.3.0-rc.2`
- **Date**: 2026-03-26

## Run command

```bash
npx @typeorm/codemod v1 --dry --ignore '**/generated*' .
```

## Analysis

24 files transformed — a Chinese blog platform using TypeORM v0.3.0-rc.2.

### Transforms

- `find-options-string-select` (12 files) — correctly converting string array select to object syntax
- `find-options-string-relations` (10 files) — correctly converting string array relations
- `global-functions` (8 files) — flagging deprecated API calls across cron jobs, DB scripts, and utilities

### Dependency changes

Replaced `mysql` with `mysql2`, bumped `ioredis`, TypeORM from `0.3.0-rc.2` to `^1.0.0-beta.1`.

## Output

```
Statistics:
  Files processed:   243
  Files transformed: 24
  Files skipped:     219
  Parse errors:      0
  Time elapsed:      50.0s
Transforms applied:
  find-options-string-select                    12 files
  find-options-string-relations                 10 files
  global-functions                              8 files
  Files requiring manual review:
    global-functions:
      src/dbscript/init_db.ts
      src/dbscript/run.ts
      src/dbscript/tables.ts
      src/dbscript/updateRootCommentCount.ts
      src/dbscript/user.ts
      src/cron/user_follower_count.ts
      src/cron/user_liked_count.ts
      src/cron/user_article_count.ts
Dependency changes:
  dependencies: replaced mysql with mysql2@^3.20.0
  dependencies: bumped ioredis from 4.14.1 to ^5.10.1
  dependencies: bumped typeorm from 0.3.0-rc.2 to ^1.0.0-beta.1
Tip: run your project's formatter (e.g. prettier, eslint --fix) to clean up any style differences introduced by the codemod.
See the full migration guide for details: https://typeorm.io/docs/guides/migration-v1
```
