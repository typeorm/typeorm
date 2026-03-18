import "reflect-metadata"
import type { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { expect } from "chai"

describe("query runner > drop view", () => {
    let dataSources: DataSource[]
    beforeAll(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/view/*{.js,.ts}"],
            enabledDrivers: ["postgres", "oracle"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    afterAll(() => closeTestingConnections(dataSources))

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
})
