import type { DependencyConfig } from "./config"

export const config: DependencyConfig = {
    replacements: {
        mysql: { replacement: "mysql2", version: "^3.22.0" },
        sqlite3: { replacement: "better-sqlite3", version: "^12.9.0" },
    },

    upgrades: {
        "@google-cloud/spanner": { minVersion: "^8.0.0", version: "^8.6.0" },
        "@nestjs/typeorm": { minVersion: "^11.0.1", version: "^11.0.1" },
        "better-sqlite3": { minVersion: "^12.0.0", version: "^12.9.0" },
        expo: { minVersion: "^52.0.0", version: "^55.0.0" },
        ioredis: { minVersion: "^5.0.4", version: "^5.10.1" },
        mongodb: { minVersion: "^7.0.0", version: "^7.1.1" },
        mssql: { minVersion: "^12.0.0", version: "^12.3.0" },
        mysql2: { minVersion: "^3.15.3", version: "^3.22.0" },
        redis: { minVersion: "^5.0.0", version: "^5.12.1" },
        typeorm: { minVersion: "^1.0.0", version: "^1.0.0" },
        "typeorm-aurora-data-api-driver": {
            minVersion: "^3.0.0",
            version: "^3.0.2",
        },
    },

    incompatible: {
        "@next-auth/typeorm-legacy-adapter":
            "`@next-auth/typeorm-legacy-adapter` is incompatible with TypeORM v1 — it uses the removed global `getManager()`. Migrate to `@auth/typeorm-adapter` instead.",
        "@opentelemetry/instrumentation-typeorm":
            "`@opentelemetry/instrumentation-typeorm` is incompatible with TypeORM v1 — it patches `Repository.findByIds` which was removed. Check for an updated version that supports TypeORM v1.",
        "mock-typeorm":
            "`mock-typeorm` is incompatible with TypeORM v1 — it mocks `getCustomRepository`, `findByIds`, `findOneById`, `printSql`, and `.connection`, all of which were removed or renamed.",
        "opentelemetry-instrumentation-typeorm":
            "`opentelemetry-instrumentation-typeorm` is incompatible with TypeORM v1 — it patches `Repository.findByIds` which was removed. Use `@opentelemetry/instrumentation-typeorm` once it adds v1 support.",
        "pg-mem":
            "`pg-mem` is incompatible with TypeORM v1 — it uses the removed `getConnectionManager()` API to create TypeORM connections.",
        "typeorm-naming-strategies":
            "`typeorm-naming-strategies` is incompatible with TypeORM v1 — it imports `snakeCase` from the internal path `typeorm/util/StringUtils` (not part of the public API) and overrides removed interface methods (`classTableInheritanceParentColumnName`, `eagerJoinRelationAlias`). The package is unmaintained (last published 2022). Extend `DefaultNamingStrategy` and override `columnName`/`tableName`/etc. with snake_case logic, or implement `NamingStrategyInterface` directly.",
        "typeorm-polymorphic":
            "`typeorm-polymorphic` is incompatible with TypeORM v1 — it uses the removed `getCustomRepository()` API.",
        "typeorm-routing-controllers-extensions":
            "`typeorm-routing-controllers-extensions` is incompatible with TypeORM v1 — the IoC container system (`useContainer`) was removed. See upgrading guide.",
        "typeorm-seeding":
            "`typeorm-seeding` is incompatible with TypeORM v1 — this package uses the removed `Connection` API. Migrate to a maintained alternative or inline seeding via custom scripts.",
        "typeorm-typedi-extensions":
            "`typeorm-typedi-extensions` is incompatible with TypeORM v1 — the IoC container system (`useContainer`) was removed. See upgrading guide.",
    },

    warnings: {
        dotenv: "`dotenv` detected — TypeORM no longer auto-loads `.env` files. Make sure your database configuration is defined explicitly using `DataSource`.",
        "nestjs-typeorm-paginate":
            "`nestjs-typeorm-paginate` detected — its peer dependency `^0.3.0` excludes TypeORM v1. Check for an updated version that supports v1.",
        "typeorm-encrypted":
            "`typeorm-encrypted` detected — its peer dependency `^0.3.7` excludes TypeORM v1. Check for an updated version.",
        "typeorm-fixtures-cli":
            "`typeorm-fixtures-cli` detected — its peer dependency `^0.3.0` excludes TypeORM v1. Check for an updated version.",
        "typeorm-transactional":
            "`typeorm-transactional` detected — it uses the deprecated `.connection` property (renamed to `.dataSource`). The deprecated getter still works in v1 but may be removed in a future version. Check for an updated release.",
    },

    minNodeVersion: "20.0.0",
}
