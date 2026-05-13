import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"
import { Bug } from "./entity/Bug"

describe("github issues > #3357 Migration generation drops and creates columns instead of altering", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            enabledDrivers: ["postgres"],
            entities: [Bug],
            schemaCreate: true,
            dropSchema: true,
        })
    })

    after(() => closeTestingConnections(dataSources))

    it("should alter varchar length without dropping the column", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource.getRepository(Bug).save({
                    example: "kept-value",
                })

                const metadata = dataSource.getMetadata(Bug)
                const exampleColumn =
                    metadata.findColumnWithPropertyName("example")!
                exampleColumn.length = "51"

                const sqlInMemory = await dataSource.driver
                    .createSchemaBuilder()
                    .log()
                const upQueries = sqlInMemory.upQueries.map(
                    (query) => query.query,
                )

                expect(upQueries).to.include(
                    `ALTER TABLE "bug" ALTER COLUMN "example" TYPE character varying(51)`,
                )
                expect(upQueries.join("\n")).not.to.include("DROP COLUMN")

                await dataSource.synchronize()

                const rows = await dataSource.getRepository(Bug).find()
                expect(rows).to.have.length(1)
                expect(rows[0].example).to.equal("kept-value")

                const queryRunner = dataSource.createQueryRunner()
                try {
                    const table = await queryRunner.getTable("bug")
                    expect(table!.findColumnByName("example")!.length).to.equal(
                        "51",
                    )
                } finally {
                    await queryRunner.release()
                }
            }),
        ))
})
