import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"
import { Post } from "./entity/Post"

describe("github issues > #3357 postgres migration generation should not drop columns on varchar length changes", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Post],
            enabledDrivers: ["postgres"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    after(() => closeTestingConnections(dataSources))

    it("should alter the column type when only varchar length changes", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const postMetadata = dataSource.getMetadata(Post)
                postMetadata.findColumnWithPropertyName("name")!.length = "100"

                const sqlInMemory = await dataSource.driver
                    .createSchemaBuilder()
                    .log()
                const upQueries = sqlInMemory.upQueries
                    .map((query) => query.query)
                    .join("\n")

                expect(upQueries).to.contain(
                    'ALTER TABLE "post" ALTER COLUMN "name" TYPE character varying(100)',
                )
                expect(upQueries).not.to.contain("DROP COLUMN")
                expect(upQueries).not.to.contain("ADD COLUMN")
            }),
        ))

    it("should keep the length modifier when varchar length and collation change", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const postMetadata = dataSource.getMetadata(Post)
                const nameColumn =
                    postMetadata.findColumnWithPropertyName("name")!
                nameColumn.length = "100"
                nameColumn.collation = "C"

                const sqlInMemory = await dataSource.driver
                    .createSchemaBuilder()
                    .log()
                const upQueries = sqlInMemory.upQueries
                    .map((query) => query.query)
                    .join("\n")

                expect(upQueries).to.contain(
                    'ALTER TABLE "post" ALTER COLUMN "name" TYPE character varying(100)',
                )
                expect(upQueries).to.contain(
                    'ALTER TABLE "post" ALTER COLUMN "name" TYPE character varying(100) COLLATE "C"',
                )
                expect(upQueries).not.to.contain(
                    'TYPE character varying COLLATE "C"',
                )
                expect(upQueries).not.to.contain("DROP COLUMN")
                expect(upQueries).not.to.contain("ADD COLUMN")
            }),
        ))
})
