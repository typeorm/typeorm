import { DataSource } from "typeorm"

// Case 1: default `require("expo-sqlite")` driver — redundant in v1, removed.
const dataSource = new DataSource({
    type: "expo",
    database: "app.db",
    entities: [],
})

// Case 2: Expo data source WITHOUT a driver — nothing to remove.
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

// Case 7: quoted (string-literal) keys — driver should still be removed.
// prettier-ignore
const dataSource7 = new DataSource({
    "type": "expo",
    "database": "quoted.db"
})

// Case 8: default export — driver removed from the exported config.
export default new DataSource({
    type: "expo",
    database: "exported.db",
})

// Case 9: `driver` is the ONLY extra property — removing it leaves a valid
// config object (no trailing-comma artifact on the next-to-last line).
const dataSource9 = new DataSource({
    type: "expo",
    database: "minimal.db",
})

// Case 10: factory/spread pattern — config defined once and then spread into
// `new DataSource(...)`. The codemod still walks every ObjectExpression, so
// the `driver` line is removed from the base config even though the
// DataSource constructor is a separate expression.
const baseExpoConfig = {
    type: "expo" as const,
    database: "factory.db",
}
const dataSource10 = new DataSource({ ...baseExpoConfig, entities: [] })

// Case 11: `{ type: "expo" }` with NO `database` — the scope guard requires
// both `type: "expo"` AND a sibling `database`, so this config is left alone
// even though it would be a nonsense DataSource config. The transform won't
// touch objects where it can't confidently identify them as DataSource
// options (e.g. commander/yargs option shapes that merely reuse `type:
// "expo"`).
const notADataSource = {
    type: "expo",
    driver: require("expo-sqlite"),
}
