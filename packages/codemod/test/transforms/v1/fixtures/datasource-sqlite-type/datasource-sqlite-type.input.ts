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
