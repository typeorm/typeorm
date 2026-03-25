import type { DependencyConfig } from "./config"

export const config: DependencyConfig = {
    replacements: {
        mysql: { replacement: "mysql2", version: "^3.20.0" },
        sqlite3: { replacement: "better-sqlite3", version: "^12.8.0" },
    },

    minimumVersions: {
        "@google-cloud/spanner": "^8.0.0",
        "better-sqlite3": "^12.0.0",
        ioredis: "^5.0.4",
        mongodb: "^7.0.0",
        mssql: "^12.0.0",
        mysql2: "^3.15.3",
        redis: "^5.0.0",
        typeorm: "^1.0.0-beta.1",
        "typeorm-aurora-data-api-driver": "^3.0.0",
    },

    incompatible: {
        "typeorm-routing-controllers-extensions":
            "`typeorm-routing-controllers-extensions` is incompatible with TypeORM v1 — the IoC container system (`useContainer`) was removed. See migration guide.",
        "typeorm-typedi-extensions":
            "`typeorm-typedi-extensions` is incompatible with TypeORM v1 — the IoC container system (`useContainer`) was removed. See migration guide.",
    },

    warnings: {
        dotenv: "`dotenv` detected — TypeORM v1 no longer auto-loads `.env` files. Make sure your app loads environment variables itself (e.g. via `dotenv/config` import).",
    },

    minNodeVersion: "20.0.0",
}
