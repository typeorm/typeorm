# Twenty

- **Repository**: https://github.com/twentyhq/twenty
- **Branch**: `main`
- **Commit**: `fb34d2c`
- **TypeORM version**: `patch:typeorm@0.3.20`
- **Date**: 2026-03-26

## Run command

```bash
npx @typeorm/codemod v1 --dry .
```

## Analysis

165 files transformed out of 15,240 — Twenty is a large CRM monorepo using a patched TypeORM v0.3.20.

### Transforms

- `find-options-string-select` (67 files) — the dominant transform
- `find-options-string-relations` (59 files) — correct
- `datasource-sqlite-options` (19 files) — correct
- `connection-to-datasource` (10 files) — correct
- `datasource-mssql-domain` (9 files) — matches `domain` in domain management services (legitimate — these files import from TypeORM)

### Dependency changes

Bumped `redis`. The patched typeorm version `patch:typeorm@0.3.20#./patches/typeorm+0.3.20.patch` was correctly skipped with a warning. Dotenv warnings emitted.

## Output

```
Statistics:
  Files processed:   15240
  Files transformed: 165
  Files skipped:     15075
  Parse errors:      0
  Time elapsed:      4m 17s
Transforms applied:
  find-options-string-select                    67 files
  find-options-string-relations                 59 files
  datasource-sqlite-options                     19 files
  connection-to-datasource                      10 files
  datasource-mssql-domain                       9 files
  datasource-mongodb                            3 files
  mongodb-types                                 2 files
  repository-find-one-by-id                     2 files
  use-container                                 1 file
  repository-exist                              1 file
  Files requiring manual review:
    use-container:
      packages/twenty-server/src/main.ts
    datasource-mssql-domain:
      packages/twenty-server/src/engine/core-modules/public-domain/public-domain.service.ts
      packages/twenty-server/src/engine/core-modules/public-domain/public-domain.resolver.ts
      packages/twenty-server/src/engine/core-modules/approved-access-domain/services/approved-access-domain.spec.ts
      packages/twenty-server/src/engine/core-modules/approved-access-domain/services/approved-access-domain.service.ts
      packages/twenty-server/src/engine/core-modules/auth/services/auth.service.spec.ts
      packages/twenty-server/src/engine/core-modules/emailing-domain/services/emailing-domain.service.ts
      packages/twenty-server/src/engine/core-modules/domain/custom-domain-manager/services/custom-domain-manager.service.ts
      packages/twenty-server/src/engine/core-modules/domain/workspace-domains/services/workspace-domains.service.ts
      packages/twenty-server/src/engine/core-modules/domain/workspace-domains/services/__test__/workspace-domains.service.spec.ts
Dependency changes:
  dependencies: bumped redis from ^4.7.0 to ^5.11.0
  Errors:
    typeorm has non-standard version specifier patch:typeorm@0.3.20#./patches/typeorm+0.3.20.patch — needs manual upgrade
  Warnings:
    dotenv detected — TypeORM no longer auto-loads .env files. Make sure your database configuration is defined explicitly using DataSource. (6 times)
    engines.node is ^18.0.0 || ^20.0.0 || ^22.0.0 — TypeORM requires Node.js 20.0.0+. Update your engines field.
Tip: run your project's formatter (e.g. prettier, eslint --fix) to clean up any style differences introduced by the codemod.
See the full migration guide for details: https://typeorm.io/docs/guides/migration-v1
```
