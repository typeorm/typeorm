import { DataSource } from "typeorm"

// Case 1: Expo data source without driver — should have `driver: require("expo-sqlite")` added
// TODO(typeorm-v1): Expo legacy SQLite driver was removed — requires Expo SDK v52+ with the modern async API. `driver: require('expo-sqlite')` has been added automatically.
const dataSource = new DataSource({
    type: "expo",
    database: "app.db",
    entities: [],
    synchronize: true,
    driver: require("expo-sqlite"),
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
