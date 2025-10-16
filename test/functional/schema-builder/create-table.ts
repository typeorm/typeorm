import { expect } from "chai"
import "reflect-metadata"
import { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"
import { DriverUtils } from "../../../src/driver/DriverUtils"

describe("schema builder > create table", () => {
    let connections: DataSource[]
    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/common/*{.js,.ts}", __dirname + "/entity/:driver:/*{.js,.ts}"],
            dropSchema: true,
        })
    })
    after(() => closeTestingConnections(connections))

    it("should correctly create tables with all dependencies", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()
                let postTable = await queryRunner.getTable("post")
                let teacherTable = await queryRunner.getTable("teacher")
                let studentTable = await queryRunner.getTable("student")
                let facultyTable = await queryRunner.getTable("faculty")
                expect(postTable).to.be.undefined
                expect(teacherTable).to.be.undefined
                expect(studentTable).to.be.undefined
                expect(facultyTable).to.be.undefined

                await connection.synchronize()

                postTable = await queryRunner.getTable("post")
                const idColumn = postTable!.findColumnByName("id")
                const versionColumn = postTable!.findColumnByName("version")
                const nameColumn = postTable!.findColumnByName("name")
                postTable!.should.exist

                if (
                    DriverUtils.isMySQLFamily(connection.driver) ||
                    connection.driver.options.type === "sap" ||
                    connection.driver.options.type === "spanner"
                ) {
                    postTable!.indices.length.should.be.equal(2)
                } else {
                    postTable!.uniques.length.should.be.equal(2)
                    postTable!.checks.length.should.be.equal(1)
                }

                idColumn!.isPrimary.should.be.true
                versionColumn!.isUnique.should.be.true
                if (connection.driver.options.type !== "spanner") {
                    nameColumn!.default!.should.be.exist
                }

                teacherTable = await queryRunner.getTable("teacher")
                teacherTable!.should.exist

                studentTable = await queryRunner.getTable("student")
                studentTable!.should.exist
                studentTable!.foreignKeys.length.should.be.equal(2)
                // CockroachDB also stores indices for relation columns
                if (connection.driver.options.type === "cockroachdb") {
                    studentTable!.indices.length.should.be.equal(3)
                } else {
                    studentTable!.indices.length.should.be.equal(1)
                }

                facultyTable = await queryRunner.getTable("faculty")
                facultyTable!.should.exist

                await queryRunner.release()
            }),
        ))
})
