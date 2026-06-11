import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { Post } from "./entity/Post"
import type { DataSource } from "../../../../../src/data-source/DataSource"
import { PostWithDeleteDateColumn } from "./entity/PostWithDeleteDateColumn"

describe("persistence > persistence options > listeners", () => {
    // -------------------------------------------------------------------------
    // Configuration
    // -------------------------------------------------------------------------

    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            __dirname,
            disabledDrivers: ["spanner"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    // -------------------------------------------------------------------------
    // Specifications
    // -------------------------------------------------------------------------

    it("save listeners should work by default", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const post = new Post()
                post.id = 1
                post.title = "Bakhrom"
                post.description = "Hello"
                await dataSource.manager.save(post)
                post.title.should.be.equal("Bakhrom!")
            }),
        ))

    it("save listeners should be disabled if save option is specified", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const post = new Post()
                post.id = 1
                post.title = "Bakhrom"
                post.description = "Hello"
                await dataSource.manager.save(post, { listeners: false })
                post.title.should.be.equal("Bakhrom")
            }),
        ))

    it("remove listeners should work by default", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const post = new Post()
                post.id = 1
                post.title = "Bakhrom"
                post.description = "Hello"
                await dataSource.manager.save(post)
                await dataSource.manager.remove(post)
                post.isRemoved.should.be.equal(true)
            }),
        ))

    it("remove listeners should be disabled if remove option is specified", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const post = new Post()
                post.id = 1
                post.title = "Bakhrom"
                post.description = "Hello"
                await dataSource.manager.save(post)
                await dataSource.manager.remove(post, { listeners: false })
                post.isRemoved.should.be.equal(false)
            }),
        ))

    it("soft-remove listeners should work by default", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const post = new PostWithDeleteDateColumn()
                post.title = "Bakhrom"
                post.description = "Hello"
                await dataSource.manager.save(post)
                await dataSource.manager.softRemove(post)
                post.title.should.be.equal("Bakhrom!")
                post.isSoftRemoved.should.be.equal(true)
            }),
        ))

    it("soft-remove listeners should be disabled if remove option is specified", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const post = new PostWithDeleteDateColumn()
                post.title = "Bakhrom"
                post.description = "Hello"
                await dataSource.manager.save(post)
                await dataSource.manager.softRemove(post, { listeners: false })
                post.title.should.be.equal("Bakhrom")
                post.isSoftRemoved.should.be.equal(false)
            }),
        ))
})
