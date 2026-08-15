import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import type { DataSource } from "../../../src/data-source/DataSource"
import { expect } from "chai"
import { Post } from "./entity/Post"

describe("github issues > #3357 Migration generation drops and creates columns instead of altering resulting in data loss", () => {
    let connections: DataSource[]

    before(async () => {
        connections = await createTestingConnections({
            entities: [Post],
            enabledDrivers: ["postgres"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should generate ALTER COLUMN TYPE instead of DROP + ADD when only the column length changes", async () => {
        await Promise.all(
            connections.map(async (connection) => {
                const metadata = connection.getMetadata(Post)
                const column = metadata.columns.find(
                    (c) => c.propertyName === "example",
                )!
                // change length from 50 to 51
                column.length = "51"

                const sqlInMemory = await connection.driver
                    .createSchemaBuilder()
                    .log()

                const tableName = metadata.tableName
                const upSql = sqlInMemory.upQueries
                    .map((q) => q.query)
                    .join(" ")
                const downSql = sqlInMemory.downQueries
                    .map((q) => q.query)
                    .join(" ")

                // the column must NOT be dropped and re-created (data loss)
                expect(upSql).not.to.include("DROP COLUMN")
                // instead, an ALTER COLUMN ... TYPE should be generated
                expect(upSql).to.include(
                    `ALTER TABLE "${tableName}" ALTER COLUMN "example" TYPE character varying(51)`,
                )
                expect(downSql).to.include(
                    `ALTER TABLE "${tableName}" ALTER COLUMN "example" TYPE character varying(50)`,
                )
            }),
        )
    })
})
