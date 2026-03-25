# Nest Admin

- **Repository**: https://github.com/nicktaras/nest-admin
- **Branch**: `main`
- **Commit**: `2eeccc4`
- **TypeORM version**: `0.3.22`
- **Date**: 2026-03-25

## Run command

```bash
npx @typeorm/codemod v1 --dry --ignore '**/generated*' .
```

## Analysis

9 files transformed cleanly with zero parse errors. A NestJS admin panel using TypeORM v0.3.22.

### Transforms

- `find-options-string-relations` (4 files) — correct
- `find-options-string-select` (2 files) — correct
- `use-container` (1 file) — correctly flags `useContainer()` removal in `main.ts`
- `datasource-mssql-domain` (1 file) — **false positive**: matches `domain` in OSS config, not MSSQL
- `repository-exist` (1 file) — correct rename from `.exist()` to `.exists()`
- `repository-find-by-ids` (1 file) — correct migration to `findBy()` with `In()`

### Dependency changes

Bumped `mysql2` and `typeorm`. Dotenv warning emitted.

## Output

```
✔ Updated one package.json file (0.0s)
Statistics:
  Files processed:   234
  Files transformed: 9
  Files skipped:     225
  Parse errors:      0
  Time elapsed:      7.4s
Transforms applied:
  find-options-string-relations                 4 files
  find-options-string-select                    2 files
  use-container                                 1 file
  datasource-mssql-domain                       1 file
  repository-exist                              1 file
  repository-find-by-ids                        1 file
  Files requiring manual review:
    use-container:
      src/main.ts
    datasource-mssql-domain:
      src/config/oss.config.ts
Dependency changes:
  dependencies: bumped mysql2 from ^3.14.0 to ^3.20.0
  dependencies: bumped typeorm from 0.3.22 to ^1.0.0-beta.1
  Warnings:
    dotenv detected — TypeORM no longer auto-loads .env files. Make sure your database configuration is defined explicitly using DataSource.
Tip: run your project's formatter (e.g. prettier, eslint --fix) to clean up any style differences introduced by the codemod.
See the full migration guide for details: https://typeorm.io/docs/guides/migration-v1
```
