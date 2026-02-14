import "reflect-metadata"
import { expect } from "chai"
import { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Entity, PrimaryGeneratedColumn } from "../../../src"

describe("schema builder > change primary key constraint", () => {
    @Entity("test_entity")
    class TestEntityV1 {
        @PrimaryGeneratedColumn("uuid", { primaryKeyConstraintName: "PK_1" })
        id: string
    }

    @Entity("test_entity")
    class TestEntityV2 {
        @PrimaryGeneratedColumn("uuid", { primaryKeyConstraintName: "PK_2" })
        id: string
    }

    let dataSources: DataSource[]

    afterEach(async () => {
        if (dataSources) await closeTestingConnections(dataSources)
    })

    it("should generate migration to rename primary key constraint", async () => {
        // Initialize with V1 and sync
        dataSources = await createTestingConnections({
            entities: [TestEntityV1],
            enabledDrivers: ["postgres", "cockroachdb", "mssql", "oracle"],
            schemaCreate: true,
            dropSchema: true,
        })

        expect(dataSources.length).to.be.greaterThan(0)

        await reloadTestingDatabases(dataSources)
        await closeTestingConnections(dataSources)

        // Initialize with V2 (same table, changed constraint name)
        dataSources = await createTestingConnections({
            entities: [TestEntityV2],
            enabledDrivers: ["postgres", "cockroachdb", "mssql", "oracle"],
            schemaCreate: false,
            dropSchema: false,
        })

        await Promise.all(
            dataSources.map(async (dataSource) => {
                const sqlInMemory = await dataSource.driver
                    .createSchemaBuilder()
                    .log()

                const upQueries = sqlInMemory.upQueries.map((q) => q.query)

                console.log(
                    `[${dataSource.driver.options.type}] Generated Queries:`,
                    upQueries,
                )

                expect(upQueries).to.not.be.empty

                const queriesString = upQueries.join(" ")

                // Should contain PK_1 and PK_2 in some form (drop/add/rename)
                // For example: DROP CONSTRAINT "PK_1" or ADD CONSTRAINT "PK_2"
                expect(queriesString).to.match(/PK_1/)
                expect(queriesString).to.match(/PK_2/)
            }),
        )
    })
})
