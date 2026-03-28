import { DataSource } from "typeorm"

const dataSource = new DataSource({
    type: "mssql",
    domain: "MYDOMAIN",
    username: "user",
    options: {
        isolation: "READ_COMMITTED",
        connectionIsolationLevel: "REPEATABLE_READ",
    },
})
