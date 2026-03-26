# Cool Admin Midway

- **Repository**: https://github.com/cool-team-official/cool-admin-midway
- **Branch**: `8.x`
- **Commit**: `43b0e10`
- **TypeORM version**: `npm:@cool-midway/typeorm@0.3.20`
- **Date**: 2026-03-26

## Run command

```bash
npx @typeorm/codemod v1 --dry .
```

## Analysis

5 files transformed successfully. The project uses a custom `npm:@cool-midway/typeorm@0.3.20` alias for the TypeORM package.

### Transforms

- `repository-exist` (3 files) — correctly renames `.exist()` to `.exists()`
- `find-options-string-select` (2 files) — correctly converts string array select to object syntax

### Dependency changes

Bumped `mysql2`. Node.js engine warning: `>=18.0.0` needs updating to 20+. The non-standard `npm:` alias version was correctly skipped with a warning.

## Output

```
Statistics:
  Files processed:   153
  Files transformed: 5
  Files skipped:     148
  Parse errors:      0
  Time elapsed:      12m 39s
Transforms applied:
  repository-exist                              3 files
  find-options-string-select                    2 files
Dependency changes:
  dependencies: bumped mysql2 from ^3.14.0 to ^3.20.0
  Warnings:
    typeorm has non-standard version specifier npm:@cool-midway/typeorm@0.3.20 — skipping upgrade
    engines.node is >=18.0.0 — TypeORM requires Node.js 20.0.0+. Update your engines field.
Tip: run your project's formatter (e.g. prettier, eslint --fix) to clean up any style differences introduced by the codemod.
See the full migration guide for details: https://typeorm.io/docs/guides/migration-v1
```
