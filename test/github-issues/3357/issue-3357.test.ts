import "reflect-metadata"
import { expect } from "chai"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"
import type { DataSource } from "../../../src"
import { Post } from "./entity/Post"

describe("github issues > #3357 migration generation should alter varchar length without dropping column", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            enabledDrivers: ["postgres"],
            entities: [Post],
            schemaCreate: true,
            dropSchema: true,
        })
    })

    after(() => closeTestingConnections(dataSources))

    it("generates ALTER COLUMN TYPE for varchar length changes", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const metadata = connection.getMetadata(Post)
                const column = metadata.columns.find(
                    (column) => column.propertyName === "example",
                )!
                column.length = "51"

                const sqlInMemory = await connection.driver
                    .createSchemaBuilder()
                    .log()

                const upQueries = sqlInMemory.upQueries.map((query) =>
                    query.query.replaceAll(/\s+/g, " ").trim(),
                )
                const downQueries = sqlInMemory.downQueries.map((query) =>
                    query.query.replaceAll(/\s+/g, " ").trim(),
                )

                expect(upQueries).to.include(
                    `ALTER TABLE "post" ALTER COLUMN "example" TYPE character varying(51)`,
                )
                expect(downQueries).to.include(
                    `ALTER TABLE "post" ALTER COLUMN "example" TYPE character varying(50)`,
                )
                expect(upQueries.join(" ")).not.to.include(
                    `DROP COLUMN "example"`,
                )
                expect(upQueries.join(" ")).not.to.include(
                    `ADD "example" character varying(51)`,
                )
            }),
        ))
})
