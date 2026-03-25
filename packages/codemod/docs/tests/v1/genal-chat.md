# Genal Chat

- **Repository**: https://github.com/genaller/genal-chat
- **Branch**: `master`
- **Commit**: `3c3c3bb`
- **TypeORM version**: `^0.2.25`
- **Date**: 2026-03-25

## Run command

```bash
npx @typeorm/codemod v1 --dry --ignore '**/generated*' .
```

## Analysis

3 files transformed — a small chat application using TypeORM v0.2.25. All transforms are `global-functions`, correctly flagging deprecated API calls (`getRepository`, `getConnection`, etc.) for manual migration to `DataSource` methods.

### Dependency changes

Replaced `mysql` with `mysql2`, bumped `mongodb` from `^3.5.9` to `^7.1.1`, and TypeORM from `^0.2.25` to `^1.0.0-beta.1`.

## Output

```
✔ Updated 1 out of 2 package.json files (0.0s)
Statistics:
  Files processed:   64
  Files transformed: 3
  Files skipped:     61
  Parse errors:      0
  Time elapsed:      4.5s
Transforms applied:
  global-functions                              3 files
  Files requiring manual review:
    global-functions:
      genal-chat-server/src/modules/group/group.service.ts
      genal-chat-server/src/modules/chat/chat.gateway.ts
      genal-chat-server/src/modules/friend/friend.service.ts
Dependency changes:
  dependencies: replaced mysql with mysql2@^3.20.0
  dependencies: bumped mongodb from ^3.5.9 to ^7.1.1
  dependencies: bumped typeorm from ^0.2.25 to ^1.0.0-beta.1
Tip: run your project's formatter (e.g. prettier, eslint --fix) to clean up any style differences introduced by the codemod.
See the full migration guide for details: https://typeorm.io/docs/guides/migration-v1
```
