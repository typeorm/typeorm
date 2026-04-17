import { DataSource, DataSourceOptions, QueryRunner } from "typeorm"

const options: DataSourceOptions = {
    type: "postgres",
    database: "test",
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

// Metadata types also had `.connection` renamed to `.dataSource` (#12249)
function useEntityMetadata(meta: EntityMetadata) {
    return meta.dataSource.getRepository(meta.target)
}

function useColumnMetadata(col: ColumnMetadata) {
    return col.dataSource.driver
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
