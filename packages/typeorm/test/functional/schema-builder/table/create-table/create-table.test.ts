import { expect } from "chai"
import "reflect-metadata"
import type { DataSource } from "../../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../../../utils/test-utils"
import { DriverUtils } from "../../../../../src/driver/DriverUtils"

describe("schema builder > create table", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            disabledDrivers: ["spanner"],
            entities: [__dirname + "/entity/*{.js,.ts}"],
            dropSchema: true,
        })
    })
    after(() => closeTestingConnections(dataSources))

    it("should correctly create tables with all dependencies", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                let postTable = await queryRunner.getTable("post")
                let teacherTable = await queryRunner.getTable("teacher")
                let studentTable = await queryRunner.getTable("student")
                let facultyTable = await queryRunner.getTable("faculty")
                expect(postTable).to.be.undefined
                expect(teacherTable).to.be.undefined
                expect(studentTable).to.be.undefined
                expect(facultyTable).to.be.undefined

                await dataSource.synchronize()

                postTable = await queryRunner.getTable("post")
                const idColumn = postTable!.findColumnByName("id")
                const versionColumn = postTable!.findColumnByName("version")
                const nameColumn = postTable!.findColumnByName("name")
                postTable!.should.exist

                if (
                    DriverUtils.isMySQLFamily(dataSource.driver) ||
                    dataSource.driver.options.type === "sap" ||
                    dataSource.driver.options.type === "spanner"
                ) {
                    postTable!.indices.length.should.be.equal(2)
                } else {
                    postTable!.uniques.length.should.be.equal(2)
                    postTable!.checks.length.should.be.equal(1)
                }

                idColumn!.isPrimary.should.be.true
                versionColumn!.isUnique.should.be.true
                if (dataSource.driver.options.type !== "spanner") {
                    nameColumn!.default!.should.be.exist
                }

                teacherTable = await queryRunner.getTable("teacher")
                teacherTable!.should.exist

                studentTable = await queryRunner.getTable("student")
                studentTable!.should.exist
                studentTable!.foreignKeys.length.should.be.equal(2)
                // CockroachDB also stores indices for relation columns
                if (dataSource.driver.options.type === "cockroachdb") {
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
