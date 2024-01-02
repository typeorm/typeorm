import "reflect-metadata"
import "../../utils/test-setup"
import { expect } from "chai"
import { Post } from "./entity/Post"
import { Category } from "./entity/Category"
import {
    closeTestingConnections,
    createTestingConnections,
    getTypeOrmConfig,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
import { QueryRunner } from "../../../src"

const expectCurrentApplicationName = async (
    queryRunner: QueryRunner,
    name: string,
) => {
    const result = await queryRunner.query(
        "SELECT current_setting('application_name') as application_name;",
    )
    expect(result[0].application_name).to.equal(name)
}

describe("Connection replication", () => {
    describe("after connection is established successfully", function () {
        let connection: DataSource
        beforeEach(async () => {
            const ormConfigConnectionOptionsArray = getTypeOrmConfig()
            const postgres = ormConfigConnectionOptionsArray.find(
                (options) => options.type == "postgres",
            )
            if (!postgres)
                throw new Error(
                    "need a postgres connection in the test connection options to test replication",
                )

            connection = (
                await createTestingConnections({
                    entities: [Post, Category],
                    enabledDrivers: ["postgres"],
                    schemaCreate: true,
                    dropSchema: true,
                    driverSpecific: {
                        replication: {
                            master: { ...postgres, applicationName: "master" },
                            slaves: [{ ...postgres, applicationName: "slave" }],
                        },
                    },
                })
            )[0]

            if (!connection) return

            const post = new Post()
            post.title = "TypeORM Intro"

            await connection
                .createQueryBuilder()
                .insert()
                .into(Post)
                .values(post)
                .execute()
        })

        afterEach(() => closeTestingConnections([connection]))

        it("connection.isConnected should be true", () => {
            if (connection.driver.options.type !== "postgres") return
            connection.isInitialized.should.be.true
        })

        it("query runners should go to the master by default", async () => {
            if (connection.driver.options.type !== "postgres") return
            const queryRunner = connection.createQueryRunner()
            expect(queryRunner.getReplicationMode()).to.equal("master")

            await expectCurrentApplicationName(queryRunner, "master")
            await queryRunner.release()
        })

        it("query runners can have their replication mode overridden", async () => {
            if (connection.driver.options.type !== "postgres") return
            let queryRunner = connection.createQueryRunner("master")
            queryRunner.getReplicationMode().should.equal("master")
            await expectCurrentApplicationName(queryRunner, "master")
            await queryRunner.release()

            queryRunner = connection.createQueryRunner("slave")
            queryRunner.getReplicationMode().should.equal("slave")
            await expectCurrentApplicationName(queryRunner, "slave")
            await queryRunner.release()
        })

        it("read queries should go to the slaves by default", async () => {
            if (connection.driver.options.type !== "postgres") return
            const result = await connection.manager
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
            if (connection.driver.options.type !== "postgres") return
            const result = await connection.manager
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
        let connection: DataSource
        beforeEach(async () => {
            const ormConfigConnectionOptionsArray = getTypeOrmConfig()
            const postgres = ormConfigConnectionOptionsArray.find(
                (options) => options.type == "postgres",
            )
            if (!postgres)
                throw new Error(
                    "need a postgres connection in the test connection options to test replication",
                )

            connection = (
                await createTestingConnections({
                    entities: [Post, Category],
                    enabledDrivers: ["postgres"],
                    schemaCreate: true,
                    dropSchema: true,
                    driverSpecific: {
                        replication: {
                            defaultMode: "master",
                            master: { ...postgres, applicationName: "master" },
                            slaves: [{ ...postgres, applicationName: "slave" }],
                        },
                    },
                })
            )[0]

            const post = new Post()
            post.title = "TypeORM Intro"

            await connection
                .createQueryBuilder()
                .insert()
                .into(Post)
                .values(post)
                .execute()
        })

        afterEach(() => closeTestingConnections([connection]))

        it("query runners should go to the master by default", async () => {
            if (connection.driver.options.type !== "postgres") return
            const queryRunner = connection.createQueryRunner()
            expect(queryRunner.getReplicationMode()).to.equal("master")

            await expectCurrentApplicationName(queryRunner, "master")
            await queryRunner.release()
        })

        it("query runners can have their replication mode overridden", async () => {
            if (connection.driver.options.type !== "postgres") return
            let queryRunner = connection.createQueryRunner("master")
            queryRunner.getReplicationMode().should.equal("master")
            await expectCurrentApplicationName(queryRunner, "master")
            await queryRunner.release()

            queryRunner = connection.createQueryRunner("slave")
            queryRunner.getReplicationMode().should.equal("slave")
            await expectCurrentApplicationName(queryRunner, "slave")
            await queryRunner.release()
        })

        it("read queries should go to the master by default", async () => {
            if (connection.driver.options.type !== "postgres") return
            const result = await connection.manager
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
})
