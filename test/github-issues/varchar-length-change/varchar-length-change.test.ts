import "reflect-metadata"
import { expect } from "chai"
import { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Column, Entity, PrimaryGeneratedColumn, TableColumn } from "../../../src"

@Entity("bug_test_table")
class BugTestEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column({
        type: "varchar",
        length: 50,
    })
    example: string
}

describe("github issues > varchar length change should use ALTER COLUMN TYPE (not DROP/ADD)", () => {
    let connections: DataSource[]
    before(async () => {
        connections = await createTestingConnections({
            entities: [BugTestEntity],
            enabledDrivers: ["postgres"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should preserve data when increasing varchar length without DROP/ADD", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                // Insert test data with the original column definition (length: 50)
                await queryRunner.query(
                    `INSERT INTO "bug_test_table" ("example") VALUES ('This is test data with length 50')`,
                )

                // Verify data was inserted
                let result = await queryRunner.query(
                    `SELECT "example" FROM "bug_test_table" WHERE "id" = 1`,
                )
                expect(result[0].example).to.equal(
                    "This is test data with length 50",
                )

                // Now change the column length from 50 to 100
                const metadata = connection.getMetadata(BugTestEntity)
                const exampleColumn =
                    metadata.findColumnWithPropertyName("example")!
                exampleColumn.length = "100"
                exampleColumn.build(connection)

                // Synchronize the schema - this should use ALTER COLUMN TYPE, not DROP/ADD
                await connection.synchronize(false)

                // Verify data is still there (would be lost with DROP/ADD)
                result = await queryRunner.query(
                    `SELECT "example" FROM "bug_test_table" WHERE "id" = 1`,
                )
                expect(result[0].example).to.equal(
                    "This is test data with length 50",
                )

                // Verify the column length changed
                const table = await queryRunner.getTable("bug_test_table")
                const column = table!.findColumnByName("example")
                expect(column!.length).to.equal("100")

                await queryRunner.release()
            }),
        ))

    it("should handle multiple length changes correctly", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                // Insert test data
                await queryRunner.query(
                    `INSERT INTO "bug_test_table" ("example") VALUES ('Test data')`,
                )

                // Change from 50 to 100
                let metadata = connection.getMetadata(BugTestEntity)
                let exampleColumn = metadata.findColumnWithPropertyName("example")!
                exampleColumn.length = "100"
                exampleColumn.build(connection)
                await connection.synchronize(false)

                // Verify data preserved
                let result = await queryRunner.query(
                    `SELECT "example" FROM "bug_test_table" WHERE "id" = 1`,
                )
                expect(result[0].example).to.equal("Test data")

                // Change from 100 to 255
                metadata = connection.getMetadata(BugTestEntity)
                exampleColumn = metadata.findColumnWithPropertyName("example")!
                exampleColumn.length = "255"
                exampleColumn.build(connection)
                await connection.synchronize(false)

                // Verify data still preserved
                result = await queryRunner.query(
                    `SELECT "example" FROM "bug_test_table" WHERE "id" = 1`,
                )
                expect(result[0].example).to.equal("Test data")

                // Verify final column length
                const table = await queryRunner.getTable("bug_test_table")
                const column = table!.findColumnByName("example")
                expect(column!.length).to.equal("255")

                await queryRunner.release()
            }),
        ))

    it("should handle decreasing varchar length (with potential warnings)", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                // Insert test data that fits in original length
                await queryRunner.query(
                    `INSERT INTO "bug_test_table" ("example") VALUES ('Short')`,
                )

                // Change from 50 to 100 first
                let metadata = connection.getMetadata(BugTestEntity)
                let exampleColumn = metadata.findColumnWithPropertyName("example")!
                exampleColumn.length = "100"
                exampleColumn.build(connection)
                await connection.synchronize(false)

                // Now decrease from 100 back to 50
                metadata = connection.getMetadata(BugTestEntity)
                exampleColumn = metadata.findColumnWithPropertyName("example")!
                exampleColumn.length = "50"
                exampleColumn.build(connection)
                await connection.synchronize(false)

                // Verify data preserved (since it fits in 50 chars)
                const result = await queryRunner.query(
                    `SELECT "example" FROM "bug_test_table" WHERE "id" = 1`,
                )
                expect(result[0].example).to.equal("Short")

                // Verify final column length
                const table = await queryRunner.getTable("bug_test_table")
                const column = table!.findColumnByName("example")
                expect(column!.length).to.equal("50")

                await queryRunner.release()
            }),
        ))
})
