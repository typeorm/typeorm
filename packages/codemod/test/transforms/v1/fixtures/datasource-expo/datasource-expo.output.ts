import { DataSource } from "typeorm"

// Case 1: Expo data source — should be flagged with a SDK v52 reminder TODO
// TODO(typeorm-v1): Expo legacy SQLite driver was removed — requires Expo SDK v52+ with the modern async API. TypeORM auto-loads `expo-sqlite` now; no `driver:` option is needed unless you want to override it.
const dataSource = new DataSource({
    type: "expo",
    database: "app.db",
    entities: [],
    synchronize: true,
})

// Case 2: Expo data source with an explicit driver — still flagged (the SDK
// version requirement applies regardless of whether the driver is injected)
// TODO(typeorm-v1): Expo legacy SQLite driver was removed — requires Expo SDK v52+ with the modern async API. TypeORM auto-loads `expo-sqlite` now; no `driver:` option is needed unless you want to override it.
const dataSource2 = new DataSource({
    type: "expo",
    database: "app.db",
    driver: require("expo-sqlite"),
    entities: [],
})

// Case 3: non-Expo data source — should NOT be touched
const dataSource3 = new DataSource({
    type: "better-sqlite3",
    database: "app.db",
    entities: [],
})

// Case 4: quoted keys — should also be detected
// prettier-ignore
// TODO(typeorm-v1): Expo legacy SQLite driver was removed — requires Expo SDK v52+ with the modern async API. TypeORM auto-loads `expo-sqlite` now; no `driver:` option is needed unless you want to override it.
const dataSource4 = new DataSource({
    "type": "expo",
    "database": "quoted.db",
    "entities": [],
});

// Case 5: exported via `export default` — TODO should land on the export
// TODO(typeorm-v1): Expo legacy SQLite driver was removed — requires Expo SDK v52+ with the modern async API. TypeORM auto-loads `expo-sqlite` now; no `driver:` option is needed unless you want to override it.
export default new DataSource({
    type: "expo",
    database: "exported.db",
    entities: [],
})

// Case 6: `{ type: "expo" }` WITHOUT a sibling `database` property — do NOT
// flag; unrelated configs elsewhere shouldn't get a TODO appended.
const cliOpts = {
    type: "expo",
    label: "Expo CLI",
}

// Case 7: idempotency — a file that already has the TODO should round-trip
// unchanged.
// TODO(typeorm-v1): Expo legacy SQLite driver was removed — requires Expo SDK v52+ with the modern async API. TypeORM auto-loads `expo-sqlite` now; no `driver:` option is needed unless you want to override it.
const dataSource7 = new DataSource({
    type: "expo",
    database: "already-migrated.db",
    entities: [],
})
