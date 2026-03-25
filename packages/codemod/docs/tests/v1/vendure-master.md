# Vendure (`master` branch)

- **Repository**: https://github.com/vendure-ecommerce/vendure
- **Branch**: `master`
- **Commit**: `4f1078555`
- **TypeORM version**: `^0.3.21` (in `packages/core`)
- **Date**: 2026-03-25

## Run command

```bash
npx @typeorm/codemod v1 --dry --ignore '**/generated*' .
```

## Statistics

| Metric            | Value             |
| ----------------- | ----------------- |
| Files processed   | 2,683             |
| Files transformed | 77                |
| Files skipped     | 2,606             |
| Parse errors      | 0                 |
| Time elapsed      | 2m 1s (4 workers) |

## Transforms applied

| Transform                       | Files |
| ------------------------------- | ----- |
| `find-options-string-relations` | 59    |
| `connection-to-datasource`      | 13    |
| `datasource-sqlite-options`     | 2     |
| `global-functions`              | 2     |
| `datasource-sqlite-type`        | 2     |
| `find-options-string-select`    | 1     |

### Files requiring manual review

- `global-functions`:
    - `packages/core/src/migrate.ts`
    - `packages/testing/src/data-population/clear-all-tables.ts`

### Parse errors

None.

## Dependency changes

- `packages/core`: removed `sqlite3` (better-sqlite3 already present), bumped `better-sqlite3` to `^12.8.0`, `mysql2` to `^3.20.0`, `typeorm` to `^1.0.0-beta.1`
- `packages/testing`: bumped `mysql2` to `^3.20.0`
- **Warning**: `engines.node` is `>= 18` — TypeORM requires Node.js 20.0.0+
- **Warning**: `dotenv` detected — TypeORM no longer auto-loads `.env` files

## Analysis

All transforms applied correctly with zero false positives and zero parse errors. The `master` branch is a clean run — no telemetry code with the `constructor`-as-property Babel bug present in `minor`.

Compared to `minor`: 4 fewer files transformed (77 vs 81), 135 fewer files total (2,683 vs 2,818), and no `datasource-sap` transform hits (SAP-related code only present in `minor`).

### Not transformed (correct)

- `TransactionalConnection` wrapper class — `this.connection` accesses left untouched (not a TypeORM type)
- NestJS `app.close()` — not renamed to `.destroy()`
- Service-level `.findByIds(ctx, ids)` — not transformed (not a TypeORM repository method)
- Dashboard/image components with `w`, `j` properties — not matched (files don't import from `typeorm`)
