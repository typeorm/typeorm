import "reflect-metadata"
import type { DataSource } from "../../../src"
import { View } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { expect } from "chai"

describe("query runner > drop view", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/view/*{.js,.ts}"],
            enabledDrivers: ["postgres", "oracle", "mssql"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should correctly drop VIEW and revert dropping", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()

                let postView = await queryRunner.getView("post_view")
                await queryRunner.dropView(postView!)

                postView = await queryRunner.getView("post_view")
                expect(postView).to.be.not.exist

                await queryRunner.executeMemoryDownSql()

                postView = await queryRunner.getView("post_view")
                expect(postView).to.be.exist

                await queryRunner.release()
            }),
        ))

    it("should correctly drop MATERIALIZED VIEW and revert dropping", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()

                let postMatView = await queryRunner.getView(
                    "post_materialized_view",
                )
                await queryRunner.dropView(postMatView!)

                postMatView = await queryRunner.getView(
                    "post_materialized_view",
                )
                expect(postMatView).to.be.not.exist

                await queryRunner.executeMemoryDownSql()

                postMatView = await queryRunner.getView(
                    "post_materialized_view",
                )
                expect(postMatView).to.be.exist

                await queryRunner.release()
            }),
        ))

    it("should not throw when dropping non-existent view with ifExists", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                await queryRunner.dropView("non_existent_view", true)
                await queryRunner.release()
            }),
        ))

    it.only("should delete views that do not belong to the default schema", async () => {
        await Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                await queryRunner.createSchema("other_schema", true)

                let postOtherSchemaView: View | undefined = new View({
                    schema: "other_schema",
                    name: "post_other_schema_view",
                    expression:
                        dataSource.driver.options.type === "mssql"
                            ? "SELECT * FROM post"
                            : `SELECT * FROM "public"."post"`,
                })
                await queryRunner.createView(postOtherSchemaView, true)

                await queryRunner.dropView(postOtherSchemaView!)

                postOtherSchemaView = await queryRunner.getView(
                    dataSource.driver.options.type === "mssql"
                        ? "other_schema.post_other_schema_view"
                        : `"other_schema".post_other_schema_view`,
                )
                expect(postOtherSchemaView).to.be.not.exist

                await queryRunner.dropSchema("other_schema", true)
            }),
        )
    })

    it("should delete views that were not created with typeorm metadata", async () => {
        await Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()

                let postNoMetadataView: View | undefined = new View({
                    name: "post_no_metadata_view",
                    expression: `SELECT * FROM post`,
                })
                let postMatNoMetadataView: View | undefined = new View({
                    name: "materialized_post_no_metadata_view",
                    expression: `SELECT * FROM post`,
                    materialized: true,
                })

                await queryRunner.createView(postNoMetadataView)
                await queryRunner.createView(postMatNoMetadataView)

                await queryRunner.dropView(postNoMetadataView!)

                postNoMetadataView = await queryRunner.getView(
                    `post_no_metadata_view`,
                )
                expect(postNoMetadataView).to.be.not.exist

                await queryRunner.dropView(postMatNoMetadataView!)

                postMatNoMetadataView = await queryRunner.getView(
                    `materialized_post_no_metadata_view`,
                )
                expect(postMatNoMetadataView).to.be.not.exist
            }),
        )
    })
})
