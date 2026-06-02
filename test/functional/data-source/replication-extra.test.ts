// Regression test for https://github.com/typeorm/typeorm/issues/12555
// Verifies that credentials.extra in replication config is merged over the
// top-level extra when creating pg.Pool instances.

import { expect } from "chai"
import * as sinon from "sinon"
import { DataSource } from "../../../src"
import { PlatformTools } from "../../../src/platform/PlatformTools"
import type { PostgresDataSourceOptions } from "../../../src/driver/postgres/PostgresDataSourceOptions"

const fakeClient = {
    query(sql: string): Promise<{ rows: any[]; rowCount: number }> {
        if (sql.includes("version()")) {
            return Promise.resolve({
                rows: [
                    {
                        version:
                            "PostgreSQL 14.0 on x86_64-pc-linux-gnu, compiled by gcc 8.5.0, 64-bit",
                    },
                ],
                rowCount: 1,
            })
        }
        if (sql.includes("current_database()")) {
            return Promise.resolve({
                rows: [{ current_database: "mydb" }],
                rowCount: 1,
            })
        }
        if (sql.includes("current_schema()")) {
            return Promise.resolve({
                rows: [{ current_schema: "public" }],
                rowCount: 1,
            })
        }
        return Promise.resolve({ rows: [], rowCount: 0 })
    },
    on(_event: string, _cb: Function) {},
    removeListener(_event: string, _cb: Function) {},
    release() {},
}

describe("Replication per-endpoint extra pool configuration (#12555)", () => {
    let sandbox: sinon.SinonSandbox

    const capturedOptions: Record<string, unknown>[] = []

    beforeEach(() => {
        sandbox = sinon.createSandbox()
        capturedOptions.length = 0

        const FakePool = function (this: any, opts: Record<string, unknown>) {
            capturedOptions.push({ ...opts })
            this.options = opts
            this.on = (_event: string, _cb: Function) => {}
            this.connect = (cb: Function) => cb(null, fakeClient, () => {})
            this.end = (cb: Function) => cb(null)
        } as any

        sandbox.stub(PlatformTools, "load").callsFake((lib: string) => {
            if (lib === "pg") {
                return {
                    Pool: FakePool,
                    types: { setTypeParser: () => {} },
                    defaults: {},
                }
            }
            throw new Error(`unexpected load: ${lib}`)
        })
    })

    afterEach(() => {
        sandbox.restore()
    })

    it("merges credentials.extra over top-level extra for slave pools", async () => {
        const options: PostgresDataSourceOptions = {
            type: "postgres",
            extra: { idleTimeoutMillis: 10_000 },
            replication: {
                master: {
                    host: "writer.example.com",
                    port: 5432,
                    username: "app",
                    password: "secret",
                    database: "mydb",
                },
                slaves: [
                    {
                        host: "reader.example.com",
                        port: 5432,
                        username: "app",
                        password: "secret",
                        database: "mydb",
                        extra: { maxLifetimeSeconds: 60 },
                    },
                ],
            },
        }

        const dataSource = new DataSource(options)
        await dataSource.initialize()

        // Two pools created: slaves first, then master (see PostgresDriver.connect)
        expect(capturedOptions).to.have.length(2)

        const [slaveOpts, masterOpts] = capturedOptions

        // Slave pool: inherits top-level extra AND gets its own extra merged on top
        expect(slaveOpts.idleTimeoutMillis).to.equal(10_000)
        expect(slaveOpts.maxLifetimeSeconds).to.equal(60)

        // Master pool: inherits top-level extra but NOT the slave's extra
        expect(masterOpts.idleTimeoutMillis).to.equal(10_000)
        expect(masterOpts.maxLifetimeSeconds).to.be.undefined

        await dataSource.destroy()
    })

    it("is backward-compatible when credentials.extra is absent", async () => {
        const options: PostgresDataSourceOptions = {
            type: "postgres",
            extra: { idleTimeoutMillis: 5_000 },
            replication: {
                master: {
                    host: "writer.example.com",
                    port: 5432,
                    username: "app",
                    password: "secret",
                    database: "mydb",
                },
                slaves: [
                    {
                        host: "reader.example.com",
                        port: 5432,
                        username: "app",
                        password: "secret",
                        database: "mydb",
                    },
                ],
            },
        }

        const dataSource = new DataSource(options)
        await dataSource.initialize()

        expect(capturedOptions).to.have.length(2)

        const [slaveOpts, masterOpts] = capturedOptions

        // Both pools get top-level extra only — no per-endpoint overrides
        expect(slaveOpts.idleTimeoutMillis).to.equal(5_000)
        expect(masterOpts.idleTimeoutMillis).to.equal(5_000)
        expect(slaveOpts.maxLifetimeSeconds).to.be.undefined
        expect(masterOpts.maxLifetimeSeconds).to.be.undefined

        await dataSource.destroy()
    })
})
