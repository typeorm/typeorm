import { DataSource } from "typeorm"

const dataSource = new DataSource({
    type: "sqlite",
    database: "db.sqlite",
})

// Also runs on ormconfig-style plain exports that do not import from "typeorm"
export default {
    type: "sqlite",
    database: "db.sqlite",
}

// Unrelated object without a `database` sibling must be left untouched
const loggerConfig = {
    type: "sqlite",
    level: "info",
}

// String-literal keys (e.g. JSON-style quoted `"type"`) must also be rewritten
// prettier-ignore
const quoted = {
    "type": "sqlite",
    "database": "db.sqlite",
}
