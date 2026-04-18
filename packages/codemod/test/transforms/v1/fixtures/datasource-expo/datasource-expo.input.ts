import { DataSource } from "typeorm"

// Case 1: Expo data source without driver — should have `driver: require("expo-sqlite")` added
const dataSource = new DataSource({
    type: "expo",
    database: "app.db",
    entities: [],
    synchronize: true,
})

// Case 2: Expo data source that already has a driver — should NOT be touched
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

// Case 4: quoted keys — should also be detected and rewritten
// prettier-ignore
const dataSource4 = new DataSource({
    "type": "expo",
    "database": "quoted.db",
    "entities": [],
})

// Case 5: exported via `export default` — TODO should land on the export
export default new DataSource({
    type: "expo",
    database: "exported.db",
    entities: [],
})

// Case 6: `{ type: "expo" }` WITHOUT a sibling `database` property — do NOT
// mutate; unrelated configs elsewhere shouldn't get `driver` appended.
const cliOpts = {
    type: "expo",
    label: "Expo CLI",
}

// Case 7: idempotency — a file that already has the TODO + driver injected
// should round-trip unchanged.
// TODO(typeorm-v1): Expo legacy SQLite driver was removed — requires Expo SDK v52+ with the modern async API. `driver: require("expo-sqlite")` has been added automatically.
const dataSource7 = new DataSource({
    type: "expo",
    database: "already-migrated.db",
    driver: require("expo-sqlite"),
    entities: [],
})
