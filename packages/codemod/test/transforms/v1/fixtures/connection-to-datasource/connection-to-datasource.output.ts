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

// Accessor-chain tracking: untyped vars assigned from `dataSource.X`
// should inherit TypeORM's typed-variable tracking.
const manager = connection.manager
const mgrDs = manager.dataSource
const repo = connection.getRepository(User)
const repoDs = repo.dataSource
const qr = connection.createQueryRunner()
const qrDs = qr.dataSource

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
