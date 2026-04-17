import { DataSource, DataSourceOptions, QueryRunner } from "typeorm"

const options: DataSourceOptions = {
    type: "postgres",
    database: "test",
}

const connection = new DataSource(options)
await connection.initialize()
console.log(connection.isInitialized)
await connection.destroy()

// TSTypeQuery: `typeof Connection` in a type position should rename
function makeDs(ctor: typeof DataSource, options: DataSourceOptions) {
    return new ctor(options)
}

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

// Metadata types also had `.connection` renamed to `.dataSource` (#12249)
function useEntityMetadata(meta: EntityMetadata) {
    return meta.dataSource.getRepository(meta.target)
}

function useColumnMetadata(col: ColumnMetadata) {
    return col.dataSource.driver
}

// DataSource-typed parameter should also be tracked as a DataSource instance
function reinitialize(ds: DataSource) {
    if (ds.isInitialized) return
    return ds.initialize()
}

// TypeScript expression wrappers must unwrap to the underlying identifier
async function bounce(ds: DataSource) {
    await (ds as DataSource).initialize()
    await ds!.destroy()
    const runner = (ds as DataSource).createQueryRunner()
    return runner.dataSource
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
