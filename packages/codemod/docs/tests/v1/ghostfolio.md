# Ghostfolio

- **Repository**: https://github.com/ghostfolio/ghostfolio
- **Branch**: `main`
- **Commit**: `048406c`
- **TypeORM version**: none
- **Date**: 2026-03-25

## Run command

```bash
npx @typeorm/codemod v1 --dry --ignore '**/generated*' .
```

## Analysis

Zero files transformed — Ghostfolio does not directly depend on TypeORM (it uses Prisma as its ORM). The codemod correctly skipped all 757 files.

The only output is a dotenv warning, which comes from the package.json scan finding `dotenv` as a dependency.

## Output

```
✔ No package.json changes needed (0.0s)
Statistics:
  Files processed:   757
  Files transformed: 0
  Files skipped:     757
  Parse errors:      0
  Time elapsed:      21.0s
Dependency changes:
  Warnings:
    dotenv detected — TypeORM no longer auto-loads .env files. Make sure your database configuration is defined explicitly using DataSource.
Tip: run your project's formatter (e.g. prettier, eslint --fix) to clean up any style differences introduced by the codemod.
See the full migration guide for details: https://typeorm.io/docs/guides/migration-v1
```
