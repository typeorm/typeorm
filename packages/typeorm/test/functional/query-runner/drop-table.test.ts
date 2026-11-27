import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"

describe("query runner > drop table", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            disabledDrivers: ["spanner"],
            entities: [__dirname + "/entity/*{.js,.ts}"],
            schemaCreate: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should correctly drop table without relations and revert drop", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()

                let table = await queryRunner.getTable("post")
                table!.should.exist

                await queryRunner.dropTable("post")

                table = await queryRunner.getTable("post")
                expect(table).to.be.undefined

                await queryRunner.executeMemoryDownSql()

                table = await queryRunner.getTable("post")
                table!.should.exist

                await queryRunner.release()
            }),
        ))

    it("should correctly drop table with relations and revert drop", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()

                let studentTable = await queryRunner.getTable("student")
                let teacherTable = await queryRunner.getTable("teacher")
                let facultyTable = await queryRunner.getTable("faculty")
                studentTable!.should.exist
                teacherTable!.should.exist
                facultyTable!.should.exist

                await queryRunner.dropTable(studentTable!)
                await queryRunner.dropTable(teacherTable!)
                await queryRunner.dropTable(facultyTable!)

                studentTable = await queryRunner.getTable("student")
                teacherTable = await queryRunner.getTable("teacher")
                facultyTable = await queryRunner.getTable("faculty")
                expect(studentTable).to.be.undefined
                expect(teacherTable).to.be.undefined
                expect(facultyTable).to.be.undefined

                await queryRunner.executeMemoryDownSql()

                studentTable = await queryRunner.getTable("student")
                teacherTable = await queryRunner.getTable("teacher")
                facultyTable = await queryRunner.getTable("faculty")
                studentTable!.should.exist
                teacherTable!.should.exist
                facultyTable!.should.exist

                await queryRunner.release()
            }),
        ))

    it("should not throw when dropping non-existent table with ifExists", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                await queryRunner.dropTable("non_existent_table", true)
                await queryRunner.release()
            }),
        ))
})
