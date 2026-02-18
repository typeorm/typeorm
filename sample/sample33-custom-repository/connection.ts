import "reflect-metadata"
import { DataSource } from "../../src"

export const Sample33CustomRepositoryConnection = new DataSource({
    type: "better-sqlite3",
    database: "./temp/better-sqlite3.db",
    logging: true,
    synchronize: true,
})
