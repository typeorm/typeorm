import {
    Connection,
    ConnectionOptions,
    QueryRunner,
    EntityMetadata,
    ColumnMetadata,
    IndexMetadata,
} from "typeorm"
import type { SapConnectionOptions } from "typeorm/driver/sap/SapConnectionOptions"
import type { BetterSqlite3ConnectionOptions } from "typeorm/driver/better-sqlite3/BetterSqlite3ConnectionOptions"

// Cross-directory rename: the `sqlite/` directory was removed in v1
import type { SqliteConnectionOptions } from "typeorm/driver/sqlite/SqliteConnectionOptions"

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

// TSTypeQuery: `typeof Connection` in a type position should rename
function makeDs(ctor: typeof Connection, options: ConnectionOptions) {
    return new ctor(options)
}

// Property access on typed variables: .connection → .dataSource
function migrate(queryRunner: QueryRunner) {
    const ds = queryRunner.connection
}

const runner: QueryRunner = getRunner()
const ds2 = runner.connection

// Accessor-chain tracking: untyped vars assigned from `dataSource.X`
// should inherit TypeORM's typed-variable tracking.
const manager = connection.manager
const mgrDs = manager.connection
const repo = connection.getRepository(User)
const repoDs = repo.connection
const qr = connection.createQueryRunner()
const qrDs = qr.connection

// `EntityMetadata` exposes `.dataSource` directly in v1 — simple rename
function useEntityMetadata(meta: EntityMetadata) {
    return meta.connection.getRepository(meta.target)
}

// `ColumnMetadata` / `IndexMetadata` never had `.dataSource` — access now
// goes through `.entityMetadata.dataSource`
function useColumnMetadata(col: ColumnMetadata) {
    return col.connection.driver
}

function useIndexMetadata(idx: IndexMetadata) {
    return idx.connection.driver.options.type
}

// DataSource-typed parameter should also be tracked as a DataSource instance
function reinitialize(ds: DataSource) {
    if (ds.isConnected) return
    return ds.connect()
}

// TypeScript expression wrappers must unwrap to the underlying identifier
async function bounce(ds: DataSource) {
    await (ds as DataSource).connect()
    await ds!.close()
    const runner = (ds as DataSource).createQueryRunner()
    return runner.connection
}

// CommonJS require(): destructured identifier + deep-path both rewrite
const { Connection: LegacyConn } = require("typeorm")
const {
    SapConnectionOptions: LegacySapOpts,
} = require("typeorm/driver/sap/SapConnectionOptions")

const cjs = new LegacyConn(options)

// Aliased CJS bindings should still get method renames applied
await cjs.connect()
await cjs.close()

// Duplicate-rename: user imports both Connection AND DataSource from typeorm.
// The rename of Connection → DataSource must not produce `{ DataSource, DataSource }`.
import { Connection as Conn2, DataSource as DS2 } from "typeorm"
const both = new Conn2(options)
const another = new DS2(options)

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

// Sub-path re-exports should also be renamed (matches the deep-path import rule)
export { SapConnectionOptions } from "typeorm/driver/sap/SapConnectionOptions"

// Options-typed parameters must NOT be classified as DataSource instances.
// `opts` is a plain value-object whose `.connect` / `.close` methods are
// unrelated to DataSource's; they must NOT be renamed to initialize/destroy.
import type { MysqlConnectionOptions } from "typeorm"
function inspectOpts(opts: MysqlConnectionOptions) {
    opts.connect()
    opts.close()
    return opts
}
