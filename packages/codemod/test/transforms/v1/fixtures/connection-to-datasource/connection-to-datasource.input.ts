import { Connection, ConnectionOptions, QueryRunner } from "typeorm"
import type { SapConnectionOptions } from "typeorm/driver/sap/SapConnectionOptions"

// Deep path whose final segment is NOT an exact rename key must be left alone
import { something } from "typeorm/driver/sap/ThingsConnectionHelper"

const options: ConnectionOptions = {
    type: "postgres",
    database: "test",
}

const sapOptions: SapConnectionOptions = {
    type: "sap",
    database: "hana",
}

const connection = new Connection(options)
await connection.connect()
console.log(connection.isConnected)
await connection.close()

// Property access on typed variables: .connection → .dataSource
function migrate(queryRunner: QueryRunner) {
    const ds = queryRunner.connection
}

const runner: QueryRunner = getRunner()
const ds2 = runner.connection

// Metadata types also had `.connection` renamed to `.dataSource` (#12249)
function useEntityMetadata(meta: EntityMetadata) {
    return meta.connection.getRepository(meta.target)
}

function useColumnMetadata(col: ColumnMetadata) {
    return col.connection.driver
}

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
