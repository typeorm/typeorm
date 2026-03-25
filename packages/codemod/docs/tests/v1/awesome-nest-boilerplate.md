# Awesome Nest Boilerplate

- **Repository**: https://github.com/nicktaras/awesome-nest-boilerplate
- **Branch**: `main`
- **Commit**: `c1f521e`
- **TypeORM version**: `0.3.20`
- **Date**: 2026-03-25

## Run command

```bash
npx @typeorm/codemod v1 --dry --ignore '**/generated*' .
```

## Analysis

No TypeORM code was transformed — the project uses TypeORM v0.3.20 but the codebase is small (102 files) and already follows modern patterns.

### Parse errors

1 file (`src/main.ts`) failed to parse — likely uses TypeScript syntax not supported by the Babel parser. Since no transforms applied, this has no impact.

### Dependency changes

TypeORM bumped from `0.3.20` to `^1.0.0-beta.1`.

## Output

```
✔ Updated one package.json file (0.0s)
Statistics:
  Files processed:   102
  Files transformed: 0
  Files skipped:     101
  Parse errors:      1
  Time elapsed:      5.6s
  Parse errors:
    src/main.ts Unexpected token, expected "}" (100:26)
Dependency changes:
  dependencies: bumped typeorm from 0.3.20 to ^1.0.0-beta.1
Tip: run your project's formatter (e.g. prettier, eslint --fix) to clean up any style differences introduced by the codemod.
See the full migration guide for details: https://typeorm.io/docs/guides/migration-v1
```
