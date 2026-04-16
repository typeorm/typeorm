import type { DependencyConfig } from "./config"

export const config: DependencyConfig = {
    replacements: {
        mysql: { replacement: "mysql2", version: "^3.20.0" },
        sqlite3: { replacement: "better-sqlite3", version: "^12.8.0" },
    },

    upgrades: {
        "@google-cloud/spanner": { minVersion: "^8.0.0", version: "^8.6.0" },
        "better-sqlite3": { minVersion: "^12.0.0", version: "^12.8.0" },
        ioredis: { minVersion: "^5.0.4", version: "^5.10.1" },
        mongodb: { minVersion: "^7.0.0", version: "^7.1.1" },
        mssql: { minVersion: "^12.0.0", version: "^12.2.1" },
        mysql2: { minVersion: "^3.15.3", version: "^3.20.0" },
        redis: { minVersion: "^5.0.0", version: "^5.11.0" },
        typeorm: { minVersion: "^1.0.0-beta.1", version: "^1.0.0-beta.1" },
        "typeorm-aurora-data-api-driver": {
            minVersion: "^3.0.0",
            version: "^3.0.2",
        },
    },

    incompatible: {
        "typeorm-routing-controllers-extensions":
            "`typeorm-routing-controllers-extensions` is incompatible with TypeORM v1 — the IoC container system (`useContainer`) was removed. See upgrading guide.",
        "typeorm-typedi-extensions":
            "`typeorm-typedi-extensions` is incompatible with TypeORM v1 — the IoC container system (`useContainer`) was removed. See upgrading guide.",
    },

    warnings: {
        dotenv: "`dotenv` detected — TypeORM no longer auto-loads `.env` files. Make sure your database configuration is defined explicitly using `DataSource`.",
        "@nestjs/typeorm":
            "`@nestjs/typeorm` detected — make sure to update to a version compatible with TypeORM 1.0. Check https://github.com/nestjs/typeorm/releases for compatibility information.",
        "typeorm-naming-strategies":
            "`typeorm-naming-strategies` detected — verify compatibility with TypeORM 1.0 before upgrading. The package uses `NamingStrategyInterface`, which is stable, but has not been tested against 1.0.",
        "typeorm-seeding":
            "`typeorm-seeding` detected — this package uses the removed `Connection` API and is not compatible with TypeORM 1.0. Migrate to a maintained alternative or inline seeding via `DataSource.runMigrations()` / custom scripts.",
    },

    minNodeVersion: "20.0.0",
}
