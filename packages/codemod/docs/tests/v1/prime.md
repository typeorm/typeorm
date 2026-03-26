# Prime

- **Repository**: https://github.com/birkir/prime
- **Branch**: `master`
- **Commit**: `336f50c`
- **TypeORM version**: `0.2.26` / `^0.2.26`
- **Date**: 2026-03-26

## Run command

```bash
npx @typeorm/codemod v1 --dry .
```

## Analysis

37 files transformed — a headless CMS built on TypeORM v0.2.26. The heaviest user of deprecated APIs among the smaller projects.

### Transforms

- `global-functions` (22 files) — extensive use of deprecated `getRepository()`, `getConnection()`, `createConnection()` across resolvers, utils, and tests
- `connection-to-datasource` (8 files) — correctly renaming Connection types and imports
- `repository-abstract` (7 files) — flagging removed `@EntityRepository`, `AbstractRepository`, and `getCustomRepository()`
- `use-container` (4 files) — flagging `useContainer()` removal
- `datasource-mssql-domain` (1 file) — legitimate match in accounts module (imports from TypeORM)
- `query-builder-where-expression` (1 file) — renaming `WhereExpression` to `WhereExpressionBuilder`

### Dependency changes

TypeORM bumped from `^0.2.26` to `^1.0.0-beta.1`. Node.js engine warning: `>= 10.*` needs updating to 20+. Dotenv warning. Incompatible package error: `typeorm-typedi-extensions`.

## Output

```
Statistics:
  Files processed:   263
  Files transformed: 37
  Files skipped:     226
  Parse errors:      0
  Time elapsed:      38.3s
Transforms applied:
  global-functions                              22 files
  connection-to-datasource                      8 files
  repository-abstract                           7 files
  use-container                                 4 files
  datasource-mssql-domain                       1 file
  query-builder-where-expression                1 file
  find-options-string-relations                 1 file
  Files requiring manual review:
    datasource-mssql-domain:
      packages/prime-core/src/modules/accounts/index.ts
    use-container:
      packages/prime-core/src/server.ts
      packages/prime-core/__tests__/modules/external.ts
      packages/prime-core/__tests__/modules/internal.ts
      packages/prime-core/__tests__/modules/accounts.ts
    global-functions:
      packages/prime-core/src/modules/external/index.ts
      packages/prime-core/src/modules/external/resolvers/createDocumentResolver.ts
      packages/prime-core/src/modules/external/resolvers/documentUnionResolver.ts
      packages/prime-core/src/modules/external/resolvers/createDocumentUpdateResolver.ts
      packages/prime-core/src/modules/internal/utils/getSchemaFields.ts
      packages/prime-core/src/modules/internal/utils/setSchemaFields.ts
      packages/prime-core/src/modules/internal/resolvers/ReleaseResolver.ts
      packages/prime-core/src/modules/internal/resolvers/PrimeResolver.ts
      packages/prime-core/src/modules/internal/resolvers/SchemaResolver.ts
      packages/prime-core/src/modules/internal/resolvers/WebhookResolver.ts
      packages/prime-core/src/modules/external/resolvers/createDocumentRemoveResolver.ts
      packages/prime-core/src/modules/external/resolvers/createAllDocumentResolver.ts
      packages/prime-core/src/modules/external/resolvers/createDocumentCreateResolver.ts
      packages/prime-core/__tests__/modules/external.ts
      packages/prime-core/__tests__/modules/internal.ts
      packages/prime-core/src/entities/SchemaField.ts
      packages/prime-core/src/entities/Schema.ts
      packages/prime-core/src/entities/User.ts
      packages/prime-core/src/utils/DocumentTransformer.ts
      packages/prime-core/src/utils/connect.ts
      packages/prime-core/src/utils/preview.ts
      packages/prime-core/src/utils/processWebhooks.ts
Dependency changes:
  dependencies: bumped typeorm from ^0.2.26 to ^1.0.0-beta.1
  Errors:
    typeorm-typedi-extensions is incompatible with TypeORM v1 — the IoC container system (useContainer) was removed. See migration guide.
  Warnings:
    engines.node is >= 10.* — TypeORM requires Node.js 20.0.0+. Update your engines field.
    dotenv detected — TypeORM no longer auto-loads .env files. Make sure your database configuration is defined explicitly using DataSource.
Tip: run your project's formatter (e.g. prettier, eslint --fix) to clean up any style differences introduced by the codemod.
See the full migration guide for details: https://typeorm.io/docs/guides/migration-v1
```
