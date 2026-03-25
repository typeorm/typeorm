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
            "`typeorm-routing-controllers-extensions` is incompatible with TypeORM v1 — the IoC container system (`useContainer`) was removed. See migration guide.",
        "typeorm-typedi-extensions":
            "`typeorm-typedi-extensions` is incompatible with TypeORM v1 — the IoC container system (`useContainer`) was removed. See migration guide.",
    },

    warnings: {
        dotenv: "`dotenv` detected — TypeORM no longer auto-loads `.env` files. Make sure your database configuration is defined explicitly using `DataSource`.",
    },

    minNodeVersion: "20.0.0",
}
