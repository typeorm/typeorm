import { expect } from "chai"
import * as sinon from "sinon"
import type { QueryRunner } from "../../../src"
import { DataSource } from "../../../src"
import { PlatformTools } from "../../../src/platform/PlatformTools"
import type { PostgresDataSourceOptions } from "../../../src/driver/postgres/PostgresDataSourceOptions"
import "../../utils/test-setup"
import {
    closeTestingConnections,
    createTestingConnections,
    getTypeOrmConfig,
} from "../../utils/test-utils"
import { Category } from "./entity/Category"
import { Post } from "./entity/Post"

const expectCurrentApplicationName = async (
    queryRunner: QueryRunner,
    name: string,
) => {
    const result = await queryRunner.query(
        "SELECT current_setting('application_name') as application_name;",
    )
    expect(result[0].application_name).to.equal(name)
}

// Fake pg client shared by pool stub tests (issue #12555)
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

// Tests for per-endpoint extra pool configuration (#12555).
// These use a pg.Pool stub so they run without a real database.
describe("Replication per-endpoint extra pool configuration", () => {
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

        // Two pools: slaves first, then master (see PostgresDriver.connect)
        expect(capturedOptions).to.have.length(2)
        const [slaveOpts, masterOpts] = capturedOptions

        expect(slaveOpts.idleTimeoutMillis).to.equal(10_000)
        expect(slaveOpts.maxLifetimeSeconds).to.equal(60)
        expect(masterOpts.idleTimeoutMillis).to.equal(10_000)
        expect(masterOpts.maxLifetimeSeconds).to.be.undefined

        await dataSource.destroy()
    })

    it("credentials.extra takes priority over top-level extra for the same key", async () => {
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
                        extra: { idleTimeoutMillis: 30_000 }, // same key, different value
                    },
                ],
            },
        }

        const dataSource = new DataSource(options)
        await dataSource.initialize()

        const [slaveOpts, masterOpts] = capturedOptions

        // Slave gets its own value; master keeps the top-level value
        expect(slaveOpts.idleTimeoutMillis).to.equal(30_000)
        expect(masterOpts.idleTimeoutMillis).to.equal(10_000)

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

        const [slaveOpts, masterOpts] = capturedOptions

        expect(slaveOpts.idleTimeoutMillis).to.equal(5_000)
        expect(masterOpts.idleTimeoutMillis).to.equal(5_000)
        expect(slaveOpts.maxLifetimeSeconds).to.be.undefined
        expect(masterOpts.maxLifetimeSeconds).to.be.undefined

        await dataSource.destroy()
    })
})

describe("Connection replication", () => {
    const ormConfigConnectionOptionsArray = getTypeOrmConfig()
    const postgresOptions = ormConfigConnectionOptionsArray.find(
        (options) => options.type == "postgres" && !options.skip,
    )
    if (!postgresOptions) {
        return
    }

    describe("after connection is established successfully", function () {
        let dataSource: DataSource

        beforeEach(async () => {
            dataSource = (
                await createTestingConnections({
                    entities: [Post, Category],
                    enabledDrivers: ["postgres"],
                    schemaCreate: true,
                    dropSchema: true,
                    driverSpecific: {
                        replication: {
                            master: {
                                ...postgresOptions,
                                applicationName: "master",
                            },
                            slaves: [
                                {
                                    ...postgresOptions,
                                    applicationName: "slave",
                                },
                            ],
                        },
                    },
                })
            )[0]

            const post = new Post()
            post.title = "TypeORM Intro"

            await dataSource
                .createQueryBuilder()
                .insert()
                .into(Post)
                .values(post)
                .execute()
        })

        afterEach(() => closeTestingConnections([dataSource]))

        it("connection.isInitialized should be true", () => {
            dataSource.isInitialized.should.be.true
        })

        it("query runners should go to the master by default", async () => {
            const queryRunner = dataSource.createQueryRunner()
            expect(queryRunner.getReplicationMode()).to.equal("master")

            await expectCurrentApplicationName(queryRunner, "master")
            await queryRunner.release()
        })

        it("query runners can have their replication mode overridden", async () => {
            let queryRunner = dataSource.createQueryRunner("master")
            queryRunner.getReplicationMode().should.equal("master")
            await expectCurrentApplicationName(queryRunner, "master")
            await queryRunner.release()

            queryRunner = dataSource.createQueryRunner("slave")
            queryRunner.getReplicationMode().should.equal("slave")
            await expectCurrentApplicationName(queryRunner, "slave")
            await queryRunner.release()
        })

        it("read queries should go to the slaves by default", async () => {
            const result = await dataSource.manager
                .createQueryBuilder(Post, "post")
                .select("id")
                .addSelect(
                    "current_setting('application_name')",
                    "current_setting",
                )
                .execute()
            expect(result[0].current_setting).to.equal("slave")
        })

        it("write queries should go to the master", async () => {
            const result = await dataSource.manager
                .createQueryBuilder(Post, "post")
                .insert()
                .into(Post)
                .values({
                    title: () => "current_setting('application_name')",
                })
                .returning("title")
                .execute()

            expect(result.raw[0].title).to.equal("master")
        })
    })

    describe("with custom replication default mode", function () {
        let dataSource: DataSource

        beforeEach(async () => {
            dataSource = (
                await createTestingConnections({
                    entities: [Post, Category],
                    enabledDrivers: ["postgres"],
                    schemaCreate: true,
                    dropSchema: true,
                    driverSpecific: {
                        replication: {
                            defaultMode: "master",
                            master: {
                                ...postgresOptions,
                                applicationName: "master",
                            },
                            slaves: [
                                {
                                    ...postgresOptions,
                                    applicationName: "slave",
                                },
                            ],
                        },
                    },
                })
            )[0]

            const post = new Post()
            post.title = "TypeORM Intro"

            await dataSource
                .createQueryBuilder()
                .insert()
                .into(Post)
                .values(post)
                .execute()
        })

        afterEach(() => closeTestingConnections([dataSource]))

        it("query runners should go to the master by default", async () => {
            const queryRunner = dataSource.createQueryRunner()
            expect(queryRunner.getReplicationMode()).to.equal("master")

            await expectCurrentApplicationName(queryRunner, "master")
            await queryRunner.release()
        })

        it("query runners can have their replication mode overridden", async () => {
            let queryRunner = dataSource.createQueryRunner("master")
            queryRunner.getReplicationMode().should.equal("master")
            await expectCurrentApplicationName(queryRunner, "master")
            await queryRunner.release()

            queryRunner = dataSource.createQueryRunner("slave")
            queryRunner.getReplicationMode().should.equal("slave")
            await expectCurrentApplicationName(queryRunner, "slave")
            await queryRunner.release()
        })

        it("read queries should go to the master by default", async () => {
            const result = await dataSource.manager
                .createQueryBuilder(Post, "post")
                .select("id")
                .addSelect(
                    "current_setting('application_name')",
                    "current_setting",
                )
                .execute()
            expect(result[0].current_setting).to.equal("master")
        })
    })

    describe("with undefined replication", function () {
        let dataSource: DataSource

        beforeEach(async () => {
            dataSource = (
                await createTestingConnections({
                    entities: [Post, Category],
                    enabledDrivers: ["postgres"],
                    schemaCreate: true,
                    dropSchema: true,
                    driverSpecific: {
                        replication: undefined,
                    },
                })
            )[0]

            const post = new Post()
            post.title = "TypeORM Intro"

            await dataSource
                .createQueryBuilder()
                .insert()
                .into(Post)
                .values(post)
                .execute()
        })

        afterEach(() => closeTestingConnections([dataSource]))

        it("query runners should go to the available instance", async () => {
            const queryRunner = dataSource.createQueryRunner()
            expect(queryRunner.getReplicationMode()).to.equal("master")

            await expectCurrentApplicationName(queryRunner, "")
            await queryRunner.release()
        })

        it("read queries should go to the available instance", async () => {
            const result = await dataSource.manager
                .createQueryBuilder(Post, "post")
                .select("id")
                .addSelect(
                    "current_setting('application_name')",
                    "current_setting",
                )
                .execute()
            expect(result[0].current_setting).to.equal("")
        })
    })
})
