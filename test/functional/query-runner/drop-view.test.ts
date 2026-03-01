import "reflect-metadata"
import { DataSource } from "../../../src"
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
            enabledDrivers: ["postgres", "oracle"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should correctly drop VIEW and revert dropping", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

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
            dataSources.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

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
})
