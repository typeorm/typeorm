# Vendure

- **Repository**: https://github.com/vendure-ecommerce/vendure
- **Branch**: `minor`
- **Commit**: `79b5454a97f9b76fed47a78dde0ad49468a935db`
- **Date**: 2026-03-25

## Run command

```bash
npx @typeorm/codemod v1 --dry --stats --workers 4 packages/
```

## Results

- **Files processed**: 2,670
- **Files transformed**: 76
- **Files skipped**: 2,594
- **Parse errors**: 0
- **Run time**: ~8m 43s (4 workers)

### Transforms applied

| Transform                       | Files | Correct                         |
| ------------------------------- | ----- | ------------------------------- |
| `find-options-string-relations` | 59    | Yes                             |
| `connection-to-datasource`      | 13    | Yes                             |
| `global-functions`              | 2     | Yes (TODOs)                     |
| `datasource-sqlite-type`        | 2     | 1 false positive (test fixture) |
| `datasource-sqlite-options`     | 1     | Yes                             |
| `find-options-string-select`    | 1     | Yes                             |

### Dependency changes

- `packages/core`: sqlite3 removed, better-sqlite3 `^12.8.0`, mysql2 `^3.20.0`, typeorm `^1.0.0-beta.1`
- `packages/testing`: mysql2 `^3.20.0`
- dotenv warning emitted

### False positives

1. **`database.collector.spec.ts`**: `type: 'sqlite'` → `type: 'better-sqlite3'` inside a test fixture. The transform cannot distinguish test fixtures from real config.

### Not transformed (correct)

- `TransactionalConnection` wrapper class — `this.connection` accesses left untouched (not a TypeORM type)
- NestJS `app.close()` — not renamed to `.destroy()`
- Service-level `.findByIds(ctx, ids)` — not transformed (not a TypeORM repository method)
- Dashboard/image components with `w`, `j` properties — not matched (files don't import from `typeorm`)
