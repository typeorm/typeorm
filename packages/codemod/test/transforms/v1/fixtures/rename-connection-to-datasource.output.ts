import { DataSource, DataSourceOptions } from "typeorm"

const options: DataSourceOptions = {
    type: "postgres",
    database: "test",
}

const connection = new DataSource(options)
await connection.initialize()
console.log(connection.isInitialized)
await connection.destroy()
