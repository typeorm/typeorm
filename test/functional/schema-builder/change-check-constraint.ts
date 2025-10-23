import "reflect-metadata"
import { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Teacher } from "./entity/common/Teacher"
import { CheckMetadata } from "../../../src/metadata/CheckMetadata"
import { DriverUtils } from "../../../src/driver/DriverUtils"

describe("schema builder > change check constraint", () => {
    let connections: DataSource[]
    before(async () => {
        connections = await createTestingConnections({
            entities: [
                __dirname + "/entity/common/*{.js,.ts}",
                __dirname + "/entity/:driver:/*{.js,.ts}",
            ],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should correctly add new check constraint", () =>
        Promise.all(
            connections.map(async (connection) => {
                if (
                    DriverUtils.isMySQLFamily(connection.driver) &&
                    !connection.driver.isCheckConstraintsSupported
                )
                    return

                const teacherMetadata = connection.getMetadata(Teacher)
                const checkMetadata = new CheckMetadata({
                    entityMetadata: teacherMetadata,
                    args: {
                        target: Teacher,
                        expression: `${connection.driver.escape(
                            "name",
                        )} <> 'asd'`,
                    },
                })
                checkMetadata.build(connection.namingStrategy)
                teacherMetadata.checks.push(checkMetadata)

                await connection.synchronize()

                const queryRunner = connection.createQueryRunner()
                const table = await queryRunner.getTable("teacher")
                await queryRunner.release()

                table!.checks.length.should.be.equal(1)
            }),
        ))

    it("should correctly change check", () =>
        Promise.all(
            connections.map(async (connection) => {
                if (
                    DriverUtils.isMySQLFamily(connection.driver) &&
                    !connection.driver.isCheckConstraintsSupported
                )
                    return

                const postMetadata = connection.getMetadata("Post")
                postMetadata.checks[0].expression = `${connection.driver.escape(
                    "likesCount",
                )} < 2000`
                postMetadata.checks[0].build(connection.namingStrategy)

                await connection.synchronize()

                const queryRunner = connection.createQueryRunner()
                const table = await queryRunner.getTable("post")
                await queryRunner.release()

                table!.checks[0]
                    .expression!.indexOf("2000")
                    .should.be.not.equal(-1)
            }),
        ))

    it("should correctly drop removed check", () =>
        Promise.all(
            connections.map(async (connection) => {
                if (
                    DriverUtils.isMySQLFamily(connection.driver) &&
                    !connection.driver.isCheckConstraintsSupported
                )
                    return

                const postMetadata = connection.getMetadata("Post")
                postMetadata.checks = []

                await connection.synchronize()

                const queryRunner = connection.createQueryRunner()
                const table = await queryRunner.getTable("post")
                await queryRunner.release()

                table!.checks.length.should.be.equal(0)
            }),
        ))
})
