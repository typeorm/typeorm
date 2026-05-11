import { expect } from "chai"
import "reflect-metadata"
import type { DataSource } from "../../../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../../utils/test-utils"
import { Bug, NEW_COLLATION, OLD_COLLATION } from "./entity/Bug"

describe("schema builder > column > change > varchar length", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            enabledDrivers: ["postgres"],
            entities: [Bug],
            schemaCreate: true,
            dropSchema: true,
        })
    })

    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    const normalizeQueries = (queries: { query: string }[]) =>
        queries.map((query) => query.query.replaceAll(/\s+/g, " ").trim())

    it("should alter varchar length without dropping and adding the column", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                await connection.getRepository(Bug).save({
                    example: "kept value",
                })

                const metadata = connection.getMetadata(Bug)
                const exampleColumn =
                    metadata.findColumnWithPropertyName("example")!
                const originalLength = exampleColumn.length

                try {
                    exampleColumn.length = "51"

                    const sqlInMemory = await connection.driver
                        .createSchemaBuilder()
                        .log()

                    const upQueries = normalizeQueries(sqlInMemory.upQueries)
                    const downQueries = normalizeQueries(
                        sqlInMemory.downQueries,
                    )

                    expect(upQueries).to.include(
                        `ALTER TABLE "bug" ALTER COLUMN "example" TYPE character varying(51)`,
                    )
                    expect(downQueries).to.include(
                        `ALTER TABLE "bug" ALTER COLUMN "example" TYPE character varying(50)`,
                    )
                    expect(upQueries.join(" ")).to.not.include(
                        `DROP COLUMN "example"`,
                    )
                    expect(upQueries.join(" ")).to.not.include(`ADD "example"`)

                    await connection.synchronize()

                    const row = await connection
                        .getRepository(Bug)
                        .findOneByOrFail({ id: 1 })

                    expect(row.example).to.equal("kept value")
                } finally {
                    exampleColumn.length = originalLength
                }
            }),
        ))

    it("should preserve varchar length when changing collation", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                await connection.getRepository(Bug).save({
                    example: "kept value",
                })

                const metadata = connection.getMetadata(Bug)
                const exampleColumn =
                    metadata.findColumnWithPropertyName("example")!
                const originalLength = exampleColumn.length
                const originalCollation = exampleColumn.collation

                try {
                    exampleColumn.length = "51"
                    exampleColumn.collation = NEW_COLLATION

                    const sqlInMemory = await connection.driver
                        .createSchemaBuilder()
                        .log()

                    const upQueries = normalizeQueries(sqlInMemory.upQueries)
                    const downQueries = normalizeQueries(
                        sqlInMemory.downQueries,
                    )
                    const upTypeQueries = upQueries.filter((query) =>
                        query.includes(`ALTER COLUMN "example" TYPE`),
                    )

                    expect(upTypeQueries).to.deep.equal([
                        `ALTER TABLE "bug" ALTER COLUMN "example" TYPE character varying(51) COLLATE "${NEW_COLLATION}"`,
                    ])
                    expect(downQueries).to.include(
                        `ALTER TABLE "bug" ALTER COLUMN "example" TYPE character varying(50) COLLATE "${OLD_COLLATION}"`,
                    )
                    expect(upQueries.join(" ")).to.not.include(
                        `DROP COLUMN "example"`,
                    )
                    expect(upQueries.join(" ")).to.not.include(`ADD "example"`)

                    await connection.synchronize()

                    const row = await connection
                        .getRepository(Bug)
                        .findOneByOrFail({ id: 1 })

                    expect(row.example).to.equal("kept value")
                } finally {
                    exampleColumn.length = originalLength
                    exampleColumn.collation = originalCollation
                }
            }),
        ))
})
