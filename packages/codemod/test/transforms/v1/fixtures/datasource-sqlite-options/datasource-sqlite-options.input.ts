import { DataSource } from "typeorm"

const dataSource = new DataSource({
    type: "better-sqlite3",
    database: "db.sqlite",
    busyTimeout: 2000,
    flags: ["OPEN_URI"],
})

// Also runs on ormconfig-style plain exports that do not import from "typeorm"
export default {
    type: "sqlite",
    database: "db.sqlite",
    busyTimeout: 500,
    flags: ["OPEN_URI"],
}

// Unrelated config with matching key names must be left untouched
const commanderOptions = {
    type: "command",
    busyTimeout: 1000,
    flags: ["--verbose"],
}

// String-literal keys (e.g. JSON-style quoted `"busyTimeout"`) must also be rewritten
// prettier-ignore
const quoted = {
    "type": "sqlite",
    "database": "db.sqlite",
    "busyTimeout": 3000,
    "flags": ["OPEN_URI"],
}
