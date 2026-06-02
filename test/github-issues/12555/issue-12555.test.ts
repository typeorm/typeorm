import { expect } from "chai"
import * as sinon from "sinon"
import { DataSource } from "../../../src"
import { PlatformTools } from "../../../src/platform/PlatformTools"
import type { PostgresDataSourceOptions } from "../../../src/driver/postgres/PostgresDataSourceOptions"

describe("github issues > #12555 per-endpoint extra pool configuration in replication mode", () => {
    let sandbox: sinon.SinonSandbox

    const capturedOptions: Record<string, unknown>[] = []

    beforeEach(() => {
        sandbox = sinon.createSandbox()
        capturedOptions.length = 0

        // Minimal fake pg.Pool that records constructor options
        const FakePool = function (this: any, opts: Record<string, unknown>) {
            capturedOptions.push({ ...opts })
            this.options = opts
            this.on = () => this
            this.connect = (_cb: Function) =>
                _cb(
                    null,
                    {
                        query: () =>
                            Promise.resolve([{ server_version: "14.0" }]),
                        release: () => {},
                    },
                    () => {},
                )
            this.end = () => Promise.resolve()
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

        // Both pools get top-level extra only
        expect(slaveOpts.idleTimeoutMillis).to.equal(5_000)
        expect(masterOpts.idleTimeoutMillis).to.equal(5_000)
        expect(slaveOpts.maxLifetimeSeconds).to.be.undefined
        expect(masterOpts.maxLifetimeSeconds).to.be.undefined

        await dataSource.destroy()
    })
})
