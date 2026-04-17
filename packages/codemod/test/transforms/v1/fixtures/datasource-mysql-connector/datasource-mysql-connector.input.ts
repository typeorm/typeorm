import { DataSource } from "typeorm"

const dataSource = new DataSource({
    type: "mysql",
    connectorPackage: "mysql2",
    host: "localhost",
    database: "test",
})
