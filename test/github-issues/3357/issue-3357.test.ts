import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"
import { Bug } from "./entity/Bug"

describe("github issues > #3357 migration generation drops columns on varchar length changes", () => {
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
                const repository = dataSource.getRepository(Bug)
                const bug = await repository.save({ example: "preserved" })

                const metadata = dataSource.getMetadata(Bug)
                const exampleColumn =
                    metadata.findColumnWithPropertyName("example")!
                exampleColumn.length = "51"

                try {
                    const sqlInMemory = await dataSource.driver
                        .createSchemaBuilder()
                        .log()
                    const upQueries = sqlInMemory.upQueries.map(
                        (query) => query.query,
                    )

                    expect(upQueries).to.include(
                        `ALTER TABLE "bug" ALTER COLUMN "example" TYPE character varying(51)`,
                    )
                    expect(
                        upQueries.some((query) =>
                            query.includes(`DROP COLUMN "example"`),
                        ),
                    ).to.be.false
                    expect(
                        upQueries.some((query) =>
                            query.includes(`ADD "example"`),
                        ),
                    ).to.be.false

                    await dataSource.synchronize(false)

                    const savedBug = await repository.findOneByOrFail({
                        id: bug.id,
                    })
                    expect(savedBug.example).to.equal("preserved")
                } finally {
                    exampleColumn.length = "50"
                }
            }),
        ))
})
