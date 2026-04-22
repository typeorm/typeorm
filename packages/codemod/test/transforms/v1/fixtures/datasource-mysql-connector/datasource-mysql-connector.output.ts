import { DataSource } from "typeorm"

const dataSource = new DataSource({
    type: "mysql",
    host: "localhost",
    database: "test",
})

// `type: "mariadb"` shares the same option shape — `connectorPackage`
// must also be removed from mariadb DataSource configs.
const mariadbDataSource = new DataSource({
    type: "mariadb",
    database: "test",
})

// Unrelated object in the same file must NOT be mutated — the scope
// guard requires `type: "mysql" | "mariadb"` as a sibling.
const postgresDataSource = new DataSource({
    type: "postgres",
    connectorPackage: "should-stay",
    database: "test",
})

const someBuildConfig = {
    connectorPackage: "webpack-loader",
    entry: "./src/index.ts",
}
