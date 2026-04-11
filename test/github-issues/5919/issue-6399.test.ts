import { expect } from "chai"
import type { DataSource, QueryRunner } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Comment } from "./entities"

describe("github issues > #5919 Caching won't work with replication enabled", () => {
    let dataSources: DataSource[]
    const queryRunners: QueryRunner[] = []

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Comment],
            schemaCreate: true,
            dropSchema: true,
            cache: true,
            enabledDrivers: ["postgres"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    afterEach(async () => {
        for (const qr of queryRunners.splice(0)) {
            await qr.release()
        }
    })
    after(() => closeTestingConnections(dataSources))

    it("should use cache with a master query runner", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const comment1 = new Comment()
                comment1.text = "first"
                await dataSource.manager.save(comment1)

                const masterQueryRunner = dataSource.createQueryRunner("master")
                queryRunners.push(masterQueryRunner)

                const results1 = await dataSource
                    .createQueryBuilder()
                    .from(Comment, "c")
                    .cache(60_000)
                    .setQueryRunner(masterQueryRunner)
                    .getRawMany()

                expect(results1.length).to.equal(1)

                const comment2 = new Comment()
                comment2.text = "second"
                await dataSource.manager.save(comment2)

                const results2 = await dataSource
                    .createQueryBuilder()
                    .from(Comment, "c")
                    .cache(60_000)
                    .setQueryRunner(masterQueryRunner)
                    .getRawMany()

                expect(results2.length).to.equal(1)
            }),
        ))

    it("should use cache with a slave query runner", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const comment1 = new Comment()
                comment1.text = "first"
                await dataSource.manager.save(comment1)

                const slaveQueryRunner = dataSource.createQueryRunner("slave")
                queryRunners.push(slaveQueryRunner)

                const results1 = await dataSource
                    .createQueryBuilder()
                    .from(Comment, "c")
                    .cache(60_000)
                    .setQueryRunner(slaveQueryRunner)
                    .getRawMany()

                expect(results1.length).to.equal(1)

                const comment2 = new Comment()
                comment2.text = "second"
                await dataSource.manager.save(comment2)

                const results2 = await dataSource
                    .createQueryBuilder()
                    .from(Comment, "c")
                    .cache(60_000)
                    .setQueryRunner(slaveQueryRunner)
                    .getRawMany()

                expect(results2.length).to.equal(1)
            }),
        ))
})
