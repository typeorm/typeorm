import { expect } from "chai"
import "reflect-metadata"
import type { DataSource } from "../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { PostStats } from "./entity/PostStats"

describe("view entity > materialized view indices", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["postgres"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    // GitHub issue #6628
    it("should create and drop materialized view indices in a generated migration", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource.dropDatabase()

                const sqlInMemory = await dataSource.driver
                    .createSchemaBuilder()
                    .log()
                const upQueries = sqlInMemory.upQueries.map(
                    ({ query }) => query,
                )
                const downQueries = sqlInMemory.downQueries.map(
                    ({ query }) => query,
                )

                expect(upQueries.join("\n")).to.match(
                    /^CREATE INDEX "IDX_post_stats_category" ON "post_stats"/m,
                )
                expect(downQueries.join("\n")).to.match(
                    /^DROP INDEX .*"IDX_post_stats_category"$/m,
                )
            }),
        ))

    // GitHub issue #6628
    it("should restore materialized view indices when a migration that recreates the view is reverted", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const metadata = dataSource.getMetadata(PostStats)
                const expression = metadata.expression
                metadata.expression = `SELECT "categoryName", COUNT("id") AS "postCount" FROM "post" GROUP BY "categoryName"`
                const sqlInMemory = await dataSource.driver
                    .createSchemaBuilder()
                    .log()
                metadata.expression = expression

                await using queryRunner = dataSource.createQueryRunner()

                for (const { query, parameters } of sqlInMemory.upQueries) {
                    await queryRunner.query(query, parameters)
                }
                let view = await queryRunner.getView("post_stats")
                expect(view!.indices.map(({ name }) => name)).to.eql([
                    "IDX_post_stats_category",
                ])

                for (const {
                    query,
                    parameters,
                } of sqlInMemory.downQueries.reverse()) {
                    await queryRunner.query(query, parameters)
                }
                view = await queryRunner.getView("post_stats")
                expect(view!.expression).to.equal(expression)
                expect(view!.indices.map(({ name }) => name)).to.eql([
                    "IDX_post_stats_category",
                ])
            }),
        ))
})
