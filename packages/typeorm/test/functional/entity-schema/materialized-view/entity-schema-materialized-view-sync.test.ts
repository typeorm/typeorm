import "reflect-metadata"
import { expect } from "chai"
import { DataSource } from "../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { PostSchema } from "./entity/PostSchema"
import {
    createPostCountSchema,
    PostCountSchema,
} from "./entity/PostCountSchema"

describe("entity-schema > materialized view > schema synchronization", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [<any>PostSchema, <any>PostCountSchema],
            enabledDrivers: ["postgres"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should replace a regular view with a materialized view when only the materialized option changed", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                // a second connection to the same database creates the regular view
                const regularDataSource = new DataSource({
                    ...dataSource.options,
                    entities: [
                        <any>PostSchema,
                        <any>createPostCountSchema(false),
                    ],
                    dropSchema: true,
                    synchronize: true,
                })
                let regularViewIsMaterialized: boolean | undefined
                try {
                    await regularDataSource.initialize()
                    const regularQueryRunner =
                        regularDataSource.createQueryRunner()
                    const regularView =
                        await regularQueryRunner.getView("post_count")
                    regularViewIsMaterialized = regularView?.materialized
                    await regularQueryRunner.release()
                } finally {
                    await regularDataSource.destroy()
                }
                expect(regularViewIsMaterialized).to.equal(false)

                // the original connection describes the same view as materialized
                await dataSource.synchronize()

                const queryRunner = dataSource.createQueryRunner()
                const view = await queryRunner.getView("post_count")
                await queryRunner.release()
                expect(view!.materialized).to.equal(true)

                // the view matches its metadata now, so a second run has nothing to change
                const sqlInMemory = await dataSource.driver
                    .createSchemaBuilder()
                    .log()
                expect(sqlInMemory.upQueries).to.have.length(0)
            }),
        ))
})
