import { DataSource } from "typeorm"

const dataSource = new DataSource({
    type: "mysql",
    host: "localhost",
    database: "test",
})
