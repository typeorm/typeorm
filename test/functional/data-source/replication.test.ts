import { expect } from "chai"
import type { QueryRunner } from "../../../src"
import type { DataSource } from "../../../src/data-source/DataSource"
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

type RequestedReplicationMode = "master" | "slave" | "primary" | "replica"

const assertQueryRunnerRoutes = async (
    createQueryRunner: (mode?: RequestedReplicationMode) => QueryRunner,
    routes: {
        mode?: RequestedReplicationMode
        expectedMode: "master" | "slave"
        expectedApplicationName: string
    }[],
) => {
    for (const route of routes) {
        const queryRunner = route.mode
            ? createQueryRunner(route.mode)
            : createQueryRunner()

        expect(queryRunner.getReplicationMode()).to.equal(route.expectedMode)
        await expectCurrentApplicationName(
            queryRunner,
            route.expectedApplicationName,
        )
        await queryRunner.release()
    }
}

const createQueryRunnerFactory =
    (dataSource: DataSource) => (mode?: RequestedReplicationMode) =>
        mode
            ? dataSource.createQueryRunner(mode)
            : dataSource.createQueryRunner()

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
            await assertQueryRunnerRoutes(
                createQueryRunnerFactory(dataSource),
                [
                    {
                        mode: "master",
                        expectedMode: "master",
                        expectedApplicationName: "master",
                    },
                    {
                        mode: "slave",
                        expectedMode: "slave",
                        expectedApplicationName: "slave",
                    },
                    {
                        mode: "primary",
                        expectedMode: "master",
                        expectedApplicationName: "master",
                    },
                    {
                        mode: "replica",
                        expectedMode: "slave",
                        expectedApplicationName: "slave",
                    },
                ],
            )
        })

        it("driver query runners should normalize alias replication mode", async () => {
            const queryRunner = dataSource.driver.createQueryRunner("replica")
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

    describe("with both legacy and alias replication endpoints", function () {
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
                            primary: {
                                ...postgresOptions,
                                applicationName: "primary-alias",
                            },
                            replicas: [
                                {
                                    ...postgresOptions,
                                    applicationName: "replica-alias",
                                },
                            ],
                        },
                    },
                })
            )[0]
        })

        afterEach(() => closeTestingConnections([dataSource]))

        it("legacy endpoints should take precedence when both endpoint styles are provided", async () => {
            await assertQueryRunnerRoutes(
                createQueryRunnerFactory(dataSource),
                [
                    {
                        mode: "master",
                        expectedMode: "master",
                        expectedApplicationName: "master",
                    },
                    {
                        mode: "slave",
                        expectedMode: "slave",
                        expectedApplicationName: "slave",
                    },
                    {
                        mode: "primary",
                        expectedMode: "master",
                        expectedApplicationName: "master",
                    },
                    {
                        mode: "replica",
                        expectedMode: "slave",
                        expectedApplicationName: "slave",
                    },
                ],
            )
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
                            defaultMode: "primary",
                            primary: {
                                ...postgresOptions,
                                applicationName: "master",
                            },
                            replicas: [
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
            await assertQueryRunnerRoutes(
                createQueryRunnerFactory(dataSource),
                [
                    {
                        mode: "primary",
                        expectedMode: "master",
                        expectedApplicationName: "master",
                    },
                    {
                        mode: "replica",
                        expectedMode: "slave",
                        expectedApplicationName: "slave",
                    },
                ],
            )
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
