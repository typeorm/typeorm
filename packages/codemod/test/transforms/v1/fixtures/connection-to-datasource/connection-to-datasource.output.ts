import { DataSource, DataSourceOptions, QueryRunner } from "typeorm"
import type { SapDataSourceOptions } from "typeorm/driver/sap/SapDataSourceOptions"
import type { BetterSqlite3DataSourceOptions } from "typeorm/driver/better-sqlite3/BetterSqlite3DataSourceOptions"

// Cross-directory rename: the `sqlite/` directory was removed in v1
import type { BetterSqlite3DataSourceOptions } from "typeorm/driver/better-sqlite3/BetterSqlite3DataSourceOptions"

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

// `EntityMetadata` exposes `.dataSource` directly in v1 — simple rename
function useEntityMetadata(meta: EntityMetadata) {
    return meta.dataSource.getRepository(meta.target)
}

// `ColumnMetadata` / `IndexMetadata` never had `.dataSource` — access now
// goes through `.entityMetadata.dataSource`
function useColumnMetadata(col: ColumnMetadata) {
    return col.entityMetadata.dataSource.driver
}

function useIndexMetadata(idx: IndexMetadata) {
    return idx.entityMetadata.dataSource.driver.options.type
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

// CommonJS require(): destructured identifier + deep-path both rewrite
const { DataSource: LegacyConn } = require("typeorm")
const {
    SapDataSourceOptions: LegacySapOpts,
} = require("typeorm/driver/sap/SapDataSourceOptions")

const cjs = new DataSource(options)

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
