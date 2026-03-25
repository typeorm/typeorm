# Hoppscotch

- **Repository**: https://github.com/hoppscotch/hoppscotch
- **Branch**: `main`
- **Commit**: `4cbe23c`
- **TypeORM version**: none
- **Date**: 2026-03-25

## Run command

```bash
npx @typeorm/codemod v1 --dry --ignore '**/generated*' .
```

## Analysis

6 files transformed out of 1,045 — Hoppscotch is primarily a REST API client, not a TypeORM-heavy application.

### Transforms

- `datasource-mssql-domain` (4 files) — **false positives**: matches `domain` properties in cookie/sandbox configs, not MSSQL. Needs TypeORM import scoping.
- `datasource-sap` (3 files) — **false positives**: likely matching SAP-related property names in unrelated code. Needs TypeORM import scoping.
- `connection-to-datasource` (2 files) — correct
- `datasource-sqlite-options` (1 file) — correct

### Parse errors

107 files failed — this is the highest error count of any project. Hoppscotch uses advanced TypeScript features extensively (`satisfies`, `using` declarations, complex generics) that Babel's TSX parser cannot handle. The backend uses NestJS with heavy decorator usage, and the frontend has many Vue-specific patterns.

### Dependency changes

No TypeORM dependency found in any package.json. Only dotenv warnings emitted.

## Output

```
✔ Updated 0 out of 15 package.json files (0.0s)
Statistics:
  Files processed:   1045
  Files transformed: 6
  Files skipped:     932
  Parse errors:      107
  Time elapsed:      41.3s
Transforms applied:
  datasource-mssql-domain                       4 files
  datasource-sap                                3 files
  connection-to-datasource                      2 files
  datasource-sqlite-options                     1 file
  Files requiring manual review:
    datasource-mssql-domain:
      packages/hoppscotch-data/src/cookies.ts
      packages/hoppscotch-js-sandbox/src/__tests__/utils/shared.spec.ts
      packages/hoppscotch-js-sandbox/src/__tests__/hopp-namespace/cookies.spec.ts
      packages/hoppscotch-common/src/helpers/import-export/import/har.ts
  Parse errors:
    packages/hoppscotch-data/src/rawKeyValue.ts Unexpected token, expected "}" (200:18)
    packages/hoppscotch-backend/src/access-token/access-token.service.ts Unexpected token, expected "}" (43:8)
    packages/hoppscotch-backend/src/auth/auth.service.ts Unexpected token, expected "}" (122:15)
    packages/hoppscotch-cli/src/commands/test.ts Unexpected token, expected "}" (46:26)
    packages/hoppscotch-cli/src/utils/collections.ts Unexpected token, expected "}" (205:57)
    packages/hoppscotch-cli/src/utils/getters.ts Unexpected token, expected "}" (126:40)
    packages/hoppscotch-backend/src/infra-config/infra-config.controller.ts Unexpected token, expected "}" (25:15)
    packages/hoppscotch-backend/src/infra-config/infra-config.service.ts Unexpected token, expected "}" (169:10)
    packages/hoppscotch-backend/src/infra-config/onboarding.controller.ts Unexpected token, expected "}" (41:15)
    packages/hoppscotch-cli/src/utils/request.ts Unexpected token, expected "}" (246:10)
    packages/hoppscotch-cli/src/utils/pre-request.ts Unexpected token, expected "}" (79:14)
    packages/hoppscotch-backend/src/auth/helper.ts Unexpected token, expected "}" (102:16)
    packages/hoppscotch-cli/src/utils/test.ts Unexpected token, expected "}" (84:24)
    packages/hoppscotch-backend/src/admin/admin.service.ts Unexpected token, expected "}" (130:16)
    packages/hoppscotch-common/src/shims.d.ts 'export declare' must be followed by an ambient declaration. (21:15)
    packages/hoppscotch-backend/src/shortcode/shortcode.service.ts Unexpected token, expected "}" (55:8)
    packages/hoppscotch-backend/src/shortcode/shortcode.service.spec.ts Unexpected token, expected "}" (126:10)
    packages/hoppscotch-backend/src/user/user.service.ts Unexpected token, expected "}" (549:15)
    packages/hoppscotch-backend/src/user/user.service.spec.ts Unexpected token, expected "}" (672:13)
    packages/hoppscotch-backend/src/user-collection/user-collection.resolver.ts Unexpected token, expected "}" (151:12)
    packages/hoppscotch-backend/src/team/team.service.ts Unexpected token, expected "}" (367:20)
    packages/hoppscotch-backend/src/team-collection/team-collection.controller.ts Unexpected token, expected "}" (40:15)
    packages/hoppscotch-common/src/composables/graphql.ts Unexpected token (48:9)
    packages/hoppscotch-backend/src/team-collection/team-collection.resolver.ts Unexpected token, expected "}" (173:8)
    packages/hoppscotch-backend/src/team-collection/team-collection.service.ts Unexpected token, expected "}" (283:8)
    packages/hoppscotch-common/src/modules/dioc.ts Unexpected token, expected "}" (32:20)
    packages/hoppscotch-common/src/modules/i18n.ts Unexpected token, expected "}" (194:8)
    packages/hoppscotch-common/src/modules/head.ts Unexpected token, expected "}" (8:20)
    packages/hoppscotch-common/src/modules/loadingbar.ts Unexpected token, expected "}" (44:17)
    packages/hoppscotch-common/src/modules/kernel-interceptors.ts Unexpected token, expected "}" (10:17)
    packages/hoppscotch-common/src/modules/toast.ts Unexpected token, expected "}" (12:20)
    packages/hoppscotch-common/src/modules/router.ts Unexpected token, expected "}" (44:20)
    packages/hoppscotch-common/src/modules/pwa.ts Unexpected token, expected "}" (46:17)
    packages/hoppscotch-common/src/modules/theming.ts Unexpected token, expected "}" (77:20)
    packages/hoppscotch-common/src/modules/tippy.ts Unexpected token, expected "}" (18:20)
    packages/hoppscotch-common/src/modules/whats-new.ts Unexpected token, expected "}" (5:16)
    packages/hoppscotch-common/src/modules/v-focus.ts Unexpected token, expected "}" (10:20)
    packages/hoppscotch-common/src/modules/ui.ts Unexpected token, expected "}" (16:20)
    packages/hoppscotch-common/src/helpers/RESTExtURLParams.ts Unexpected token, expected "}" (66:20)
    packages/hoppscotch-backend/src/user-environment/user-environments.service.spec.ts Unexpected token, expected "}" (130:10)
    packages/hoppscotch-backend/src/user-environment/user-environments.service.ts Unexpected token, expected "}" (42:15)
    packages/hoppscotch-backend/src/user-collection/user-collection.service.ts Unexpected token, expected "}" (63:8)
    packages/hoppscotch-backend/src/user-history/user-history.service.spec.ts Unexpected token, expected "}" (158:15)
    packages/hoppscotch-backend/src/user-history/user-history.service.ts Unexpected token, expected "}" (44:17)
    packages/hoppscotch-backend/src/team-environments/team-environments.service.spec.ts Unexpected token, expected "}" (160:17)
    packages/hoppscotch-common/src/newstore/environments.ts Unexpected token, expected "}" (503:20)
    packages/hoppscotch-sh-admin/src/modules/i18n.ts Unexpected token, expected "}" (22:20)
    packages/hoppscotch-sh-admin/src/modules/router.ts Unexpected token, expected "}" (43:20)
    packages/hoppscotch-sh-admin/src/modules/tippy.ts Unexpected token, expected "}" (10:20)
    packages/hoppscotch-sh-admin/src/modules/v-focus.ts Unexpected token, expected "}" (10:20)
    packages/hoppscotch-sh-admin/src/modules/toast.ts Unexpected token, expected "}" (12:20)
    packages/hoppscotch-sh-admin/src/modules/ui.ts Unexpected token, expected "}" (7:20)
    packages/hoppscotch-common/src/types/post-request.d.ts Missing initializer in const declaration. (825:4)
    packages/hoppscotch-sh-admin/src/modules/admin.ts Unexpected token, expected "}" (28:8)
    packages/hoppscotch-common/src/services/team-collection.service.ts Unexpected token, expected "}" (343:24)
    packages/hoppscotch-cli/src/options/test/env.ts Unexpected token, expected "}" (94:27)
    packages/hoppscotch-js-sandbox/src/bootstrap-code/pre-request.js Unexpected keyword 'function'. (304:10)
    packages/hoppscotch-backend/src/infra-config/dto/onboarding.dto.ts Unexpected token (18:47)
    packages/hoppscotch-common/src/helpers/backend/GQLClient.ts Unexpected token (196:9)
    packages/hoppscotch-common/src/helpers/new-codegen/har.ts Unexpected token, expected "}" (74:16)
    packages/hoppscotch-common/src/helpers/backend/helpers.ts Unexpected token, expected "}" (95:14)
    packages/hoppscotch-common/src/helpers/curl/curlparser.ts Unexpected token (121:15)
    packages/hoppscotch-common/src/helpers/rules/BodyTransition.ts Unexpected token, expected "}" (87:19)
    packages/hoppscotch-common/src/helpers/teams/TeamCollectionAdapter.ts Unexpected token, expected "}" (383:22)
    packages/hoppscotch-common/src/helpers/teams/TeamEnvironmentAdapter.ts Unexpected token, expected "}" (123:13)
    packages/hoppscotch-common/src/helpers/utils/EffectiveURL.ts Unexpected token, expected "}" (224:18)
    packages/hoppscotch-js-sandbox/src/bootstrap-code/post-request.js Unexpected keyword 'function'. (2761:10)
    packages/hoppscotch-data/src/global-environment/v/1.ts Unexpected token, expected "}" (42:7)
    packages/hoppscotch-data/src/graphql/v/2.ts Unexpected token, expected "}" (93:7)
    packages/hoppscotch-js-sandbox/src/utils/pre-request.ts Unexpected token (24:4)
    packages/hoppscotch-cli/src/__tests__/functions/collection/collectionsRunner.spec.ts Unexpected token, expected "}" (10:3)
    packages/hoppscotch-cli/src/__tests__/e2e/commands/test.spec.ts Unexpected token, expected "}" (75:14)
    packages/hoppscotch-cli/src/__tests__/functions/mutators/parseCollectionData.spec.ts Unexpected token, expected "}" (9:10)
    packages/hoppscotch-cli/src/__tests__/functions/pre-request/getPreRequestMetrics.spec.ts Unexpected token, expected "}" (7:13)
    packages/hoppscotch-cli/src/__tests__/functions/pre-request/getEffectiveRESTRequest.spec.ts Unexpected token, expected "}" (9:6)
    packages/hoppscotch-cli/src/__tests__/functions/pre-request/preRequestScriptRunner.spec.ts Unexpected token, expected "}" (62:23)
    packages/hoppscotch-cli/src/__tests__/functions/request/processRequest.spec.ts Unexpected token, expected "}" (11:3)
    packages/hoppscotch-cli/src/__tests__/functions/request/getRequestMetrics.spec.ts Unexpected token, expected "}" (7:14)
    packages/hoppscotch-cli/src/__tests__/functions/request/requestRunner.spec.ts Unexpected token, expected "}" (30:10)
    packages/hoppscotch-cli/src/__tests__/functions/test/getTestMetrics.spec.ts Unexpected token, expected "}" (7:11)
    packages/hoppscotch-cli/src/__tests__/functions/test/testDescriptorParser.spec.ts Unexpected token, expected "}" (53:11)
    packages/hoppscotch-cli/src/__tests__/functions/test/testRunner.spec.ts Unexpected token, expected "}" (70:10)
    packages/hoppscotch-cli/src/__tests__/functions/getters/getEffectiveFinalMetaData.spec.ts Unexpected token, expected "}" (7:6)
    packages/hoppscotch-common/src/helpers/editor/completion/gqlQuery.ts Unexpected token, expected "}" (16:17)
    packages/hoppscotch-common/src/helpers/editor/completion/preRequest.ts Unexpected token, expected "}" (13:10)
    packages/hoppscotch-common/src/helpers/editor/completion/testScript.ts Unexpected token, expected "}" (13:10)
    packages/hoppscotch-common/src/helpers/curl/sub_helpers/auth.ts Unexpected token, expected "}" (23:26)
    packages/hoppscotch-common/src/helpers/editor/gql/operation.ts Unexpected token, expected "}" (43:70)
    packages/hoppscotch-common/src/services/context-menu/menu/environment.menu.ts Unexpected token, expected "}" (50:13)
    packages/hoppscotch-common/src/services/context-menu/menu/parameter.menu.ts Unexpected token, expected "}" (137:13)
    packages/hoppscotch-common/src/services/context-menu/menu/url.menu.ts Unexpected token, expected "}" (163:13)
    packages/hoppscotch-common/src/services/oauth/flows/implicit.ts Unexpected token, expected "}" (70:12)
    packages/hoppscotch-common/src/services/oauth/flows/authCode.ts Unexpected token, expected "}" (179:12)
    packages/hoppscotch-common/src/helpers/editor/linting/json.ts Unexpected token, expected "}" (12:12)
    packages/hoppscotch-common/src/helpers/editor/linting/gqlQuery.ts Unexpected token, expected "}" (26:14)
    packages/hoppscotch-common/src/helpers/editor/linting/preRequest.ts Unexpected token, expected "}" (43:16)
    packages/hoppscotch-common/src/helpers/editor/linting/rawKeyValue.ts Unexpected token, expected "}" (13:12)
    packages/hoppscotch-common/src/helpers/editor/linting/jsonc.ts Unexpected token, expected "}" (13:12)
    packages/hoppscotch-common/src/helpers/editor/linting/testScript.ts Unexpected token, expected "}" (43:16)
    packages/hoppscotch-common/src/helpers/import-export/import/index.ts Unexpected token (63:41)
    packages/hoppscotch-common/src/helpers/import-export/import/postman.ts Unexpected token, expected "}" (125:11)
    packages/hoppscotch-common/src/services/spotlight/searchers/environment.searcher.ts Unexpected token, expected "}" (334:18)
    packages/hoppscotch-common/src/services/spotlight/searchers/history.searcher.ts Unexpected token, expected "}" (254:17)
    packages/hoppscotch-common/src/helpers/import-export/import/openapi/index.ts Unexpected token, expected "}" (139:17)
    packages/hoppscotch-common/src/platform/std/kernel-interceptors/extension/index.ts Unexpected keyword 'function'. (425:10)
    packages/hoppscotch-selfhost-web/src/platform/environments/desktop/index.ts Unexpected token, expected "}" (92:16)
    packages/hoppscotch-selfhost-web/src/platform/environments/web/index.ts Unexpected token, expected "}" (92:16)
Dependency changes:
  Warnings:
    dotenv detected — TypeORM no longer auto-loads .env files. Make sure your database configuration is defined explicitly using DataSource.
    dotenv detected — TypeORM no longer auto-loads .env files. Make sure your database configuration is defined explicitly using DataSource.
    dotenv detected — TypeORM no longer auto-loads .env files. Make sure your database configuration is defined explicitly using DataSource.
    dotenv detected — TypeORM no longer auto-loads .env files. Make sure your database configuration is defined explicitly using DataSource.
Tip: run your project's formatter (e.g. prettier, eslint --fix) to clean up any style differences introduced by the codemod.
See the full migration guide for details: https://typeorm.io/docs/guides/migration-v1
```
