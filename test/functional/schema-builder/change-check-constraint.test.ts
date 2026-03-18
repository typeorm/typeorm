import "reflect-metadata"
import type { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Teacher } from "./entity/Teacher"
import { Post } from "./entity/Post"
import { CheckMetadata } from "../../../src/metadata/CheckMetadata"
import { DriverUtils } from "../../../src/driver/DriverUtils"

describe("schema builder > change check constraint", () => {
    let dataSources: DataSource[]
    beforeAll(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    afterAll(() => closeTestingConnections(dataSources))

    it("should correctly add new check constraint", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                // Mysql does not support check constraints.
                if (DriverUtils.isMySQLFamily(dataSource.driver)) return

                const teacherMetadata = dataSource.getMetadata(Teacher)
                const checkMetadata = new CheckMetadata({
                    entityMetadata: teacherMetadata,
                    args: {
                        target: Teacher,
                        expression: `${dataSource.driver.escape(
                            "name",
                        )} <> 'asd'`,
                    },
                })
                checkMetadata.build(dataSource.namingStrategy)
                teacherMetadata.checks.push(checkMetadata)

                await dataSource.synchronize()

                const queryRunner = dataSource.createQueryRunner()
                const table = await queryRunner.getTable("teacher")
                await queryRunner.release()

                table!.checks.length.should.be.equal(1)
            }),
        ))

    it("should correctly change check", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                // Mysql does not support check constraints.
                if (DriverUtils.isMySQLFamily(dataSource.driver)) return

                const postMetadata = dataSource.getMetadata(Post)
                postMetadata.checks[0].expression = `${dataSource.driver.escape(
                    "likesCount",
                )} < 2000`
                postMetadata.checks[0].build(dataSource.namingStrategy)

                await dataSource.synchronize()

                const queryRunner = dataSource.createQueryRunner()
                const table = await queryRunner.getTable("post")
                await queryRunner.release()

                table!.checks[0]
                    .expression!.indexOf("2000")
                    .should.be.not.equal(-1)
            }),
        ))

    it("should correctly drop removed check", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                // Mysql does not support check constraints.
                if (DriverUtils.isMySQLFamily(dataSource.driver)) return

                const postMetadata = dataSource.getMetadata(Post)
                postMetadata.checks = []

                await dataSource.synchronize()

                const queryRunner = dataSource.createQueryRunner()
                const table = await queryRunner.getTable("post")
                await queryRunner.release()

                table!.checks.length.should.be.equal(0)
            }),
        ))
})
