# Vendure (`minor` branch)

- **Repository**: https://github.com/vendure-ecommerce/vendure
- **Branch**: `minor`
- **Commit**: `52f8f45dc`
- **TypeORM version**: `^0.3.21` (in `packages/core`)
- **Date**: 2026-03-25

## Run command

```bash
npx @typeorm/codemod v1 --dry --ignore '**/generated*' .
```

**Note:** Vendure's `e2e/graphql/generated-e2e-admin-types.ts` (42k lines) and `generated-e2e-shop-types.ts` (11k lines) are auto-generated GraphQL types that contain no TypeORM code. Excluding them with `--ignore '**/generated*'` significantly reduces run time.

## Statistics

| Metric            | Value              |
| ----------------- | ------------------ |
| Files processed   | 2,818              |
| Files transformed | 81                 |
| Files skipped     | 2,735              |
| Parse errors      | 2                  |
| Time elapsed      | 3m 27s (4 workers) |

## Transforms applied

| Transform                       | Files |
| ------------------------------- | ----- |
| `find-options-string-relations` | 60    |
| `connection-to-datasource`      | 14    |
| `datasource-sqlite-type`        | 3     |
| `find-options-string-select`    | 2     |
| `datasource-sqlite-options`     | 2     |
| `global-functions`              | 2     |
| `datasource-sap`                | 2     |

### Files requiring manual review

- `global-functions`:
    - `packages/core/src/migrate.ts`
    - `packages/testing/src/data-population/clear-all-tables.ts`

### Parse errors

- `packages/core/src/telemetry/collectors/config.collector.spec.ts` — `Unexpected keyword 'function'. (16:20)`
- `packages/core/src/telemetry/helpers/strategy-name.helper.spec.ts` — `Unexpected keyword 'function'. (65:41)`

Both are caused by `constructor` used as an object property key — a known Babel parser limitation. Neither file imports from `typeorm`, so they wouldn't have been transformed.

## Dependency changes

- `packages/core`: removed `sqlite3` (better-sqlite3 already present), bumped `better-sqlite3` to `^12.8.0`, `mysql2` to `^3.20.0`, `typeorm` to `^1.0.0-beta.1`
- `packages/testing`: bumped `mysql2` to `^3.20.0`
- **Warning**: `dotenv` detected — TypeORM no longer auto-loads `.env` files

## Analysis

All transforms applied correctly. The `minor` branch has more files than `master` (2,818 vs 2,683), including telemetry code with `constructor`-as-property patterns that trigger the Babel parser bug (2 parse errors).

### Not transformed (correct)

- `TransactionalConnection` wrapper class — `this.connection` accesses left untouched (not a TypeORM type)
- NestJS `app.close()` — not renamed to `.destroy()`
- Service-level `.findByIds(ctx, ids)` — not transformed (not a TypeORM repository method)
- Dashboard/image components with `w`, `j` properties — not matched (files don't import from `typeorm`)
