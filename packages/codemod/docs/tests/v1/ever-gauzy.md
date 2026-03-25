# Ever Gauzy

- **Repository**: https://github.com/ever-co/ever-gauzy
- **Branch**: `develop`
- **Commit**: `9c8e31d`
- **TypeORM version**: `^0.3.28`
- **Date**: 2026-03-25

## Run command

```bash
npx @typeorm/codemod v1 --dry --ignore '**/generated*' .
```

## Analysis

The largest project tested — 8,220 files, 437 transformed in 21m 37s. This is a massive NX monorepo with 85 package.json files.

### Transforms

- `connection-to-datasource` (283 files) — the dominant transform, correctly renaming typed QueryRunner/EntityManager `.connection` references
- `find-options-string-relations` (127 files) — correctly converting string array relations to object syntax
- `repository-find-one-by-id` (7 files) — migrating deprecated `findOneById()` calls
- `query-builder-on-conflict` (5 files) — flagging removed `onConflict()` for manual migration

### False positives

`datasource-mssql-domain` flagged 6 files — most are config/auth files with `domain` properties unrelated to MSSQL (OAuth domain, e2e test config, chart components). This transform needs TypeORM import scoping.

### Parse errors

23 files failed — mostly Angular components using TypeScript 5.x features (`satisfies`, decorator metadata) and custom decorator patterns that Babel's parser doesn't support. Also a `.js` script using `package` as a variable name. None of these files import from TypeORM.

### Dependency changes

TypeORM bumped across 20 packages. Redis also bumped from `^4.6.12` to `^5.11.0`. Dotenv warning emitted for 7 packages.

## Output

```
✔ Updated 20 out of 85 package.json files (0.0s)
Statistics:
  Files processed:   8220
  Files transformed: 437
  Files skipped:     7760
  Parse errors:      23
  Time elapsed:      21m 37s
Transforms applied:
  connection-to-datasource                      283 files
  find-options-string-relations                 127 files
  repository-find-one-by-id                     7 files
  datasource-mssql-domain                       6 files
  find-options-string-select                    6 files
  datasource-sap                                5 files
  query-builder-on-conflict                     5 files
  datasource-mysql-connector                    1 file
  datasource-mongodb                            1 file
  use-container                                 1 file
  Files requiring manual review:
    datasource-mssql-domain:
      apps/gauzy-e2e/src/support/commands.ts
      packages/auth/src/lib/auth0/auth0.strategy.ts
      packages/config/src/lib/environments/environment.prod.ts
      packages/config/src/lib/environments/environment.ts
      packages/auth/src/lib/mcp/server/oauth-authorization-server.ts
      packages/desktop-ui-lib/src/lib/recap/features/time-tracking-charts/time-tracking-charts.component.ts
    use-container:
      packages/core/src/lib/bootstrap/index.ts
    query-builder-on-conflict:
      packages/plugins/integration-wakatime/src/lib/wakatime.service.ts
      packages/desktop-lib/src/lib/offline/transactions/audit-queue-transaction.ts
      packages/desktop-lib/src/lib/offline/transactions/screenshot-transaction.ts
      packages/desktop-lib/src/lib/offline/transactions/user-transaction.ts
      packages/desktop-lib/src/lib/integrations/activity-watch/dao-layer/activity-watch.dao.ts
  Parse errors:
    .scripts/bump-version-electron.js Unexpected reserved word 'package'. (35:12)
    packages/core/src/lib/app/app.controller.ts Unexpected token, expected "}" (32:18)
    packages/core/src/lib/integration/default-integration.ts Unexpected token (12:36)
    packages/core/src/lib/product/product.service.ts Unexpected token, expected "}" (122:21)
    packages/plugins/integration-ai/src/lib/gauzy-ai.service.ts Unexpected token (1081:107)
    packages/ui-core/shared/src/lib/smtp/smtp.component.ts Unexpected token (102:12)
    apps/gauzy/src/app/pages/teams/teams-mutation/teams-mutation.component.ts Unexpected token (74:12)
    packages/core/src/lib/core/decorators/entity/column.decorator.ts Unexpected token (38:8)
    packages/core/src/lib/core/decorators/entity/column-index.decorator.ts Unexpected token (42:21)
    packages/core/src/lib/core/entities/custom-entity-fields/mikro-orm-base-custom-entity-field.ts Unexpected token (12:38)
    packages/core/src/lib/product/commands/handlers/product.update.handler.ts Unexpected token (192:16)
    packages/plugins/integration-ai-ui/src/lib/components/authorization/authorization.component.ts Unexpected token (85:12)
    packages/plugins/job-search-ui/src/lib/components/apply-job-manually/apply-job-manually.component.ts Unexpected token, expected "}" (272:61)
    packages/ui-core/shared/src/lib/expenses/expenses-mutation/expenses-mutation.component.ts Unexpected token, expected "}" (121:54)
    packages/ui-core/shared/src/lib/project/project-mutation/project-mutation.component.ts Unexpected token (224:20)
    packages/ui-core/shared/src/lib/organizations/organizations-step-form/organizations-step-form.component.ts Unexpected token (192:12)
    packages/ui-core/shared/src/lib/time-off/time-off-request-mutation/time-off-request-mutation.component.ts Unexpected token, expected "}" (128:43)
    packages/core/src/lib/core/decorators/entity/relations/many-to-many.decorator.ts Unexpected token, expected "}" (52:48)
    packages/core/src/lib/core/decorators/entity/relations/many-to-one.decorator.ts Unexpected token, expected "}" (63:68)
    packages/core/src/lib/core/decorators/entity/relations/one-to-many.decorator.ts Unexpected token, expected "}" (51:48)
    packages/core/src/lib/core/decorators/entity/relations/one-to-one.decorator.ts Unexpected token, expected "}" (63:57)
    packages/ui-core/shared/src/lib/user/forms/basic-info/basic-info-form.component.ts Unexpected token, expected "}" (308:80)
    apps/gauzy/src/app/pages/organizations/edit-organization/edit-organization-settings/edit-organization-other-settings/edit-organization-other-settings.component.ts Unexpected token (284:20)
Dependency changes:
  dependencies: bumped typeorm from ^0.3.28 to ^1.0.0-beta.1
  dependencies: bumped typeorm from ^0.3.28 to ^1.0.0-beta.1
  dependencies: bumped typeorm from ^0.3.28 to ^1.0.0-beta.1
  dependencies: bumped typeorm from ^0.3.28 to ^1.0.0-beta.1
  dependencies: bumped typeorm from ^0.3.28 to ^1.0.0-beta.1
  dependencies: bumped redis from ^4.6.12 to ^5.11.0
  dependencies: bumped typeorm from ^0.3.28 to ^1.0.0-beta.1
  dependencies: bumped typeorm from ^0.3.28 to ^1.0.0-beta.1
  dependencies: bumped typeorm from ^0.3.28 to ^1.0.0-beta.1
  dependencies: bumped typeorm from ^0.3.28 to ^1.0.0-beta.1
  dependencies: bumped typeorm from ^0.3.28 to ^1.0.0-beta.1
  dependencies: bumped typeorm from ^0.3.28 to ^1.0.0-beta.1
  dependencies: bumped typeorm from ^0.3.28 to ^1.0.0-beta.1
  dependencies: bumped typeorm from ^0.3.28 to ^1.0.0-beta.1
  dependencies: bumped typeorm from ^0.3.28 to ^1.0.0-beta.1
  dependencies: bumped typeorm from ^0.3.28 to ^1.0.0-beta.1
  dependencies: bumped typeorm from ^0.3.28 to ^1.0.0-beta.1
  dependencies: bumped typeorm from ^0.3.28 to ^1.0.0-beta.1
  dependencies: bumped typeorm from ^0.3.28 to ^1.0.0-beta.1
  dependencies: bumped typeorm from ^0.3.28 to ^1.0.0-beta.1
  dependencies: bumped typeorm from ^0.3.28 to ^1.0.0-beta.1
  Warnings:
    dotenv detected — TypeORM no longer auto-loads .env files. Make sure your database configuration is defined explicitly using DataSource.
    dotenv detected — TypeORM no longer auto-loads .env files. Make sure your database configuration is defined explicitly using DataSource.
    dotenv detected — TypeORM no longer auto-loads .env files. Make sure your database configuration is defined explicitly using DataSource.
    dotenv detected — TypeORM no longer auto-loads .env files. Make sure your database configuration is defined explicitly using DataSource.
    dotenv detected — TypeORM no longer auto-loads .env files. Make sure your database configuration is defined explicitly using DataSource.
    dotenv detected — TypeORM no longer auto-loads .env files. Make sure your database configuration is defined explicitly using DataSource.
    dotenv detected — TypeORM no longer auto-loads .env files. Make sure your database configuration is defined explicitly using DataSource.
Tip: run your project's formatter (e.g. prettier, eslint --fix) to clean up any style differences introduced by the codemod.
See the full migration guide for details: https://typeorm.io/docs/guides/migration-v1
```
