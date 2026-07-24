import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { Post } from "./entity/Post"
import type { DataSource } from "../../../../../src/data-source/DataSource"
import sinon from "sinon"
import { expect } from "chai"

describe("persistence > persistence options > skipExistingRecordCheck", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            __dirname,
            disabledDrivers: ["spanner"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should insert the entity into the database", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const post = new Post()
                post.id = 1
                post.title = "Hello"

                await dataSource.manager.save(Post, post, {
                    skipExistingRecordCheck: true,
                })

                const saved = await dataSource.manager.findOneBy(Post, { id: 1 })
                expect(saved).to.not.be.null
                expect(saved!.title).to.equal("Hello")
            }),
        ))

    it("should not issue a SELECT to check whether insertable entities exist", () =>
        // Each branch creates its own QueryRunner and spies on that instance,
        // so there is no shared prototype to double-wrap across concurrent drivers.
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                const selectQueries: string[] = []
                const querySpy = sinon.spy(queryRunner, "query")

                try {
                    const post = new Post()
                    post.id = 2
                    post.title = "Skip check"

                    await dataSource
                        .createEntityManager(queryRunner)
                        .save(Post, post, {
                            skipExistingRecordCheck: true,
                            // disable reload so no post-INSERT SELECT is issued
                            reload: false,
                        })

                    querySpy.args.forEach(([sql]: [string]) => {
                        if (/^\s*SELECT/i.test(sql)) selectQueries.push(sql)
                    })

                    expect(selectQueries).to.be.empty
                } finally {
                    sinon.restore()
                    await queryRunner.release()
                }
            }),
        ))

    it("should issue a SELECT to check whether entities exist without the option (control case)", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                const querySpy = sinon.spy(queryRunner, "query")

                try {
                    const post = new Post()
                    post.id = 3
                    post.title = "With check"

                    await dataSource
                        .createEntityManager(queryRunner)
                        .save(Post, post, { reload: false })

                    const hasSelect = querySpy.args.some(([sql]: [string]) =>
                        /^\s*SELECT/i.test(sql),
                    )
                    expect(hasSelect).to.be.true
                } finally {
                    sinon.restore()
                    await queryRunner.release()
                }
            }),
        ))
})
