import { DataSource } from "typeorm"

// Case 1: default `require("expo-sqlite")` driver — should be flagged as redundant
// TODO(typeorm-v1): `driver: require("expo-sqlite")` is no longer needed — TypeORM v1 auto-loads `expo-sqlite`. You can remove this line. Keep it only if you are intentionally overriding (e.g. patch-package, custom wrapper).
const dataSource = new DataSource({
    type: "expo",
    database: "app.db",
    driver: require("expo-sqlite"),
    entities: [],
})

// Case 2: Expo data source WITHOUT a driver — should NOT be touched
const dataSource2 = new DataSource({
    type: "expo",
    database: "app.db",
    entities: [],
})

// Case 3: driver is a member access (possibly custom extraction) — leave alone
const dataSource3 = new DataSource({
    type: "expo",
    database: "app.db",
    driver: require("expo-sqlite").default,
})

// Case 4: driver is an identifier (indirection we can't trace) — leave alone
import * as sqlite from "expo-sqlite"
const dataSource4 = new DataSource({
    type: "expo",
    database: "app.db",
    driver: sqlite,
})

// Case 5: driver is a different package (patch-package / custom wrapper) — leave alone
const dataSource5 = new DataSource({
    type: "expo",
    database: "app.db",
    driver: require("patched-expo-sqlite"),
})

// Case 6: non-Expo data source with an expo-sqlite driver — leave alone
const dataSource6 = new DataSource({
    type: "better-sqlite3",
    database: "app.db",
    driver: require("expo-sqlite"),
})

// Case 7: quoted keys — should also be detected
// TODO(typeorm-v1): `driver: require("expo-sqlite")` is no longer needed — TypeORM v1 auto-loads `expo-sqlite`. You can remove this line. Keep it only if you are intentionally overriding (e.g. patch-package, custom wrapper).
// prettier-ignore
const dataSource7 = new DataSource({
    "type": "expo",
    "database": "quoted.db",
    "driver": require("expo-sqlite"),
});

// Case 8: default export — TODO lands on the export statement
// TODO(typeorm-v1): `driver: require("expo-sqlite")` is no longer needed — TypeORM v1 auto-loads `expo-sqlite`. You can remove this line. Keep it only if you are intentionally overriding (e.g. patch-package, custom wrapper).
export default new DataSource({
    type: "expo",
    database: "exported.db",
    driver: require("expo-sqlite"),
})

// Case 9: idempotency — file that already has the TODO round-trips unchanged
// TODO(typeorm-v1): `driver: require("expo-sqlite")` is no longer needed — TypeORM v1 auto-loads `expo-sqlite`. You can remove this line. Keep it only if you are intentionally overriding (e.g. patch-package, custom wrapper).
const dataSource9 = new DataSource({
    type: "expo",
    database: "already-flagged.db",
    driver: require("expo-sqlite"),
})
