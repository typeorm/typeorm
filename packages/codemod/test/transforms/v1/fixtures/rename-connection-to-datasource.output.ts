import { DataSource, DataSourceOptions } from "typeorm"

const options: DataSourceOptions = {
    type: "postgres",
    database: "test",
}

const connection = new DataSource(options)
await connection.initialize()
console.log(connection.isInitialized)
await connection.destroy()

// Property access: .connection → .dataSource
const ds = queryRunner.dataSource
const ds2 = event.dataSource
const ds3 = entityManager.dataSource

// Should NOT be transformed — not TypeORM
await app.close()
await server.close()
