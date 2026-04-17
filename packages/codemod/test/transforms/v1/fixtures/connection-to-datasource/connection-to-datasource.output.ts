import { DataSource, DataSourceOptions, QueryRunner } from "typeorm"
import type { SapDataSourceOptions } from "typeorm/driver/sap/SapDataSourceOptions"

// Deep path whose final segment is NOT an exact rename key must be left alone
import { something } from "typeorm/driver/sap/ThingsConnectionHelper"

const options: DataSourceOptions = {
    type: "postgres",
    database: "test",
}

const sapOptions: SapDataSourceOptions = {
    type: "sap",
    database: "hana",
}

const connection = new DataSource(options)
await connection.initialize()
console.log(connection.isInitialized)
await connection.destroy()

// Property access on typed variables: .connection → .dataSource
function migrate(queryRunner: QueryRunner) {
    const ds = queryRunner.dataSource
}

const runner: QueryRunner = getRunner()
const ds2 = runner.dataSource

// Should NOT be transformed — not TypeORM typed
const ds3 = event.connection
const ds4 = this.connection
console.log(socket.isConnected)

// Should NOT be transformed — wrapper around TypeORM (e.g. Vendure's TransactionalConnection)
class ProductService {
    constructor(private connection: TransactionalConnection) {}

    findAll() {
        return this.connection.getRepository(Product).find()
    }
}

// Should NOT be transformed — not TypeORM
await app.close()
await server.close()
