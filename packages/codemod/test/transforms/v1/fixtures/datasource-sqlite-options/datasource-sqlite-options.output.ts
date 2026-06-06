import { DataSource } from "typeorm"

const dataSource = new DataSource({
    type: "better-sqlite3",
    database: "db.sqlite",
    timeout: 2000,
})

// Also runs on ormconfig-style plain exports that do not import from "typeorm"
export default {
    type: "sqlite",
    database: "db.sqlite",
    timeout: 500,
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
    timeout: 3000
}
