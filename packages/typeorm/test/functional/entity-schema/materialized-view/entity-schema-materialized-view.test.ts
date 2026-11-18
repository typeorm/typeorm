import "reflect-metadata"
import { expect } from "chai"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import type { DataSource } from "../../../../src/data-source/DataSource"
import { PostSchema } from "./entity/PostSchema"
import { PostCountSchema } from "./entity/PostCountSchema"

// https://github.com/typeorm/typeorm/issues/10130
describe("entity-schema > materialized view", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [<any>PostSchema, <any>PostCountSchema],
            enabledDrivers: ["postgres"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should create a view defined with an entity schema as a materialized view", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                const view = await queryRunner.getView("post_count")
                await queryRunner.release()

                expect(view).to.exist
                expect(view!.materialized).to.equal(true)
            }),
        ))

    it("should not return new data until the materialized view is refreshed", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource
                    .getRepository("Post")
                    .save({ name: "About BMW" })

                const beforeRefresh = await dataSource
                    .getRepository("PostCount")
                    .find()
                expect(Number(beforeRefresh[0].postCount)).to.equal(0)

                await dataSource.query("REFRESH MATERIALIZED VIEW post_count")

                const afterRefresh = await dataSource
                    .getRepository("PostCount")
                    .find()
                expect(Number(afterRefresh[0].postCount)).to.equal(1)
            }),
        ))
})
