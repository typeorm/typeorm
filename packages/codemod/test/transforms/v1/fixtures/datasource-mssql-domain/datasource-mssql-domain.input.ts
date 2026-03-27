import { DataSource } from "typeorm"

const dataSource = new DataSource({
    type: "mssql",
    domain: "MYDOMAIN",
    username: "user",
})
