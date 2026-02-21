import "reflect-metadata"
import { DataSource } from "../../src"

export const Sample33CustomRepositoryDataSource = new DataSource({
    type: "sqlite",
    database: "./temp/sqlitedb-1.db",
    logging: true,
    synchronize: true,
})
