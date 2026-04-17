import { Connection, ConnectionOptions, QueryRunner } from "typeorm"

const options: ConnectionOptions = {
    type: "postgres",
    database: "test",
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

// Re-exports from typeorm (barrel files) should also be renamed
export { Connection, ConnectionOptions } from "typeorm"

// Aliased re-exports keep the exported name for downstream consumers but
// rename the local specifier so the (now renamed) symbol is pulled from typeorm
export { Connection as DbConnection } from "typeorm"
