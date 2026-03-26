# Ever Gauzy

- **Repository**: https://github.com/ever-co/ever-gauzy
- **Branch**: `develop`
- **Commit**: `9c8e31d`
- **TypeORM version**: `^0.3.28`
- **Date**: 2026-03-26

## Run command

```bash
npx @typeorm/codemod v1 --dry --ignore '**/generated*' .
```

## Analysis

The largest project tested — 8,220 files, 427 transformed in 19m 23s. This is a massive NX monorepo with 85 package.json files.

### Transforms

- `connection-to-datasource` (283 files) — the dominant transform, correctly renaming typed QueryRunner/EntityManager `.connection` references
- `find-options-string-relations` (127 files) — correctly converting string array relations to object syntax
- `repository-find-one-by-id` (7 files) — migrating deprecated `findOneById()` calls
- `query-builder-on-conflict` (5 files) — flagging removed `onConflict()` for manual migration
- `datasource-sap` (1 file) — correctly scoped after fix (was 5 false positives before)

### Parse errors

23 files failed. The primary cause is old-style TypeScript type assertions (`<Type>value` instead of `value as Type`) which the TSX parser interprets as JSX tags. For example, `<string>this._configService.get(...)` and `<ColumnOptions<T>>typeOrOptions` both trigger `Unexpected token` errors. The remaining failures are Angular components and custom decorator patterns with complex generics. None of the failing files import from TypeORM, so no transforms were missed.

### Dependency changes

TypeORM bumped across 20 packages. Redis also bumped from `^4.6.12` to `^5.11.0`. Dotenv warning emitted for 7 packages.

## Output

```
Statistics:
  Files processed:   8220
  Files transformed: 427
  Files skipped:     7770
  Parse errors:      23
  Time elapsed:      19m 23s
Transforms applied:
  connection-to-datasource                      283 files
  find-options-string-relations                 127 files
  repository-find-one-by-id                     7 files
  find-options-string-select                    6 files
  query-builder-on-conflict                     5 files
  datasource-mysql-connector                    1 file
  datasource-mongodb                            1 file
  datasource-sap                                1 file
  use-container                                 1 file
  Files requiring manual review:
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
    apps/gauzy/src/app/pages/organizations/edit-organization/edit-organization-settings/edit-organization-other-settings/edit-organization-other-settings.component.ts Unexpected token (284:20)
    apps/gauzy/src/app/pages/teams/teams-mutation/teams-mutation.component.ts Unexpected token (74:12)
    packages/core/src/lib/app/app.controller.ts Unexpected token, expected "}" (32:18)
    packages/core/src/lib/core/decorators/entity/column-index.decorator.ts Unexpected token (42:21)
    packages/core/src/lib/core/decorators/entity/column.decorator.ts Unexpected token (38:8)
    packages/core/src/lib/core/decorators/entity/relations/many-to-many.decorator.ts Unexpected token, expected "}" (52:48)
    packages/core/src/lib/core/decorators/entity/relations/many-to-one.decorator.ts Unexpected token, expected "}" (63:68)
    packages/core/src/lib/core/decorators/entity/relations/one-to-many.decorator.ts Unexpected token, expected "}" (51:48)
    packages/core/src/lib/core/decorators/entity/relations/one-to-one.decorator.ts Unexpected token, expected "}" (63:57)
    packages/core/src/lib/core/entities/custom-entity-fields/mikro-orm-base-custom-entity-field.ts Unexpected token (12:38)
    packages/core/src/lib/integration/default-integration.ts Unexpected token (12:36)
    packages/core/src/lib/product/commands/handlers/product.update.handler.ts Unexpected token (192:16)
    packages/core/src/lib/product/product.service.ts Unexpected token, expected "}" (122:21)
    packages/plugins/integration-ai-ui/src/lib/components/authorization/authorization.component.ts Unexpected token (85:12)
    packages/plugins/integration-ai/src/lib/gauzy-ai.service.ts Unexpected token (1081:107)
    packages/plugins/job-search-ui/src/lib/components/apply-job-manually/apply-job-manually.component.ts Unexpected token, expected "}" (272:61)
    packages/ui-core/shared/src/lib/expenses/expenses-mutation/expenses-mutation.component.ts Unexpected token, expected "}" (121:54)
    packages/ui-core/shared/src/lib/organizations/organizations-step-form/organizations-step-form.component.ts Unexpected token (192:12)
    packages/ui-core/shared/src/lib/project/project-mutation/project-mutation.component.ts Unexpected token (224:20)
    packages/ui-core/shared/src/lib/smtp/smtp.component.ts Unexpected token (102:12)
    packages/ui-core/shared/src/lib/time-off/time-off-request-mutation/time-off-request-mutation.component.ts Unexpected token, expected "}" (128:43)
    packages/ui-core/shared/src/lib/user/forms/basic-info/basic-info-form.component.ts Unexpected token, expected "}" (308:80)
Dependency changes:
  dependencies: bumped typeorm from ^0.3.28 to ^1.0.0-beta.1 (20 times)
  dependencies: bumped redis from ^4.6.12 to ^5.11.0
  Warnings:
    dotenv detected — TypeORM no longer auto-loads .env files. Make sure your database configuration is defined explicitly using DataSource. (7 times)
Tip: run your project's formatter (e.g. prettier, eslint --fix) to clean up any style differences introduced by the codemod.
See the full migration guide for details: https://typeorm.io/docs/guides/migration-v1
```
