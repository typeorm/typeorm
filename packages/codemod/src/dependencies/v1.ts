import type { DependencyConfig } from "./config"

const TYPEORM_VERSION = "^1.0.0-beta.1"

export const config: DependencyConfig = {
    replacements: {
        sqlite3: { replacement: "better-sqlite3", version: "^12.8.0" },
        mysql: { replacement: "mysql2", version: "^3.20.0" },
    },

    minimumVersions: {
        typeorm: TYPEORM_VERSION,
        mongodb: "^7.0.0",
        mysql2: "^3.15.3",
        mssql: "^12.0.0",
        "better-sqlite3": "^12.0.0",
        "@google-cloud/spanner": "^8.0.0",
        redis: "^5.0.0",
        ioredis: "^5.0.4",
        "typeorm-aurora-data-api-driver": "^3.0.0",
    },

    incompatiblePackages: {
        "typeorm-typedi-extensions":
            "`typeorm-typedi-extensions` is incompatible with TypeORM v1 — the IoC container system (`useContainer`) was removed. See migration guide.",
        "typeorm-routing-controllers-extensions":
            "`typeorm-routing-controllers-extensions` is incompatible with TypeORM v1 — the IoC container system (`useContainer`) was removed. See migration guide.",
    },

    minNodeVersion: "20.0.0",
}
