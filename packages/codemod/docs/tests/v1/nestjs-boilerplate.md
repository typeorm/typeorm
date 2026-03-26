# NestJS Boilerplate

- **Repository**: https://github.com/vndevteam/nestjs-boilerplate
- **Branch**: `main`
- **Commit**: `63571f4`
- **TypeORM version**: `0.3.28`
- **Date**: 2026-03-26

## Run command

```bash
npx @typeorm/codemod v1 --dry .
```

## Analysis

2 files transformed — a NestJS boilerplate using TypeORM v0.3.28.

### Transforms

- `use-container` (1 file) — correctly flags `useContainer()` removal in `main.ts`
- `datasource-mongodb` (1 file) — correctly handling MongoDB option renames

### Dependency changes

TypeORM bumped from `0.3.28` to `^1.0.0-beta.1`. Node.js engine warning: `>=16.0.0` needs updating to 20+. Dotenv warning emitted.

## Output

```
Statistics:
  Files processed:   179
  Files transformed: 2
  Files skipped:     177
  Parse errors:      0
  Time elapsed:      5.4s
Transforms applied:
  use-container                                 1 file
  datasource-mongodb                            1 file
  Files requiring manual review:
    use-container:
      src/main.ts
Dependency changes:
  dependencies: bumped typeorm from 0.3.28 to ^1.0.0-beta.1
  Warnings:
    engines.node is >=16.0.0 — TypeORM requires Node.js 20.0.0+. Update your engines field.
    dotenv detected — TypeORM no longer auto-loads .env files. Make sure your database configuration is defined explicitly using DataSource.
Tip: run your project's formatter (e.g. prettier, eslint --fix) to clean up any style differences introduced by the codemod.
See the full migration guide for details: https://typeorm.io/docs/guides/migration-v1
```
