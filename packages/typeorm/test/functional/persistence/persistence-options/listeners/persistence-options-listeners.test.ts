import "reflect-metadata"
import { expect } from "chai"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { Post } from "./entity/Post"
import type { DataSource } from "../../../../../src/data-source/DataSource"
import { PostWithDeleteDateColumn } from "./entity/PostWithDeleteDateColumn"
import { PostWithDeleteDateColumnSubscriber } from "./subscriber/PostWithDeleteDateColumnSubscriber"

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

    // GitHub issue #9155 - changes made in soft-remove and recover listeners were not persisted
    it("soft-remove listeners should persist entity changes", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const post = new PostWithDeleteDateColumn()
                post.title = "Bakhrom"
                post.description = "Hello"
                await dataSource.manager.save(post)
                await dataSource.manager.softRemove(post)

                const loadedPost = await dataSource.manager.findOneOrFail(
                    PostWithDeleteDateColumn,
                    { where: { id: post.id }, withDeleted: true },
                )
                loadedPost.title.should.be.equal("Bakhrom!")
                loadedPost.deletedAt.should.be.instanceOf(Date)
                post.version.should.be.equal(loadedPost.version)
                post.updatedAt
                    .getTime()
                    .should.be.equal(loadedPost.updatedAt.getTime())
            }),
        ))

    it("recover listeners should persist entity changes", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const post = new PostWithDeleteDateColumn()
                post.title = "Bakhrom"
                post.description = "Hello"
                await dataSource.manager.save(post)
                await dataSource.manager.softRemove(post, { listeners: false })
                await dataSource.manager.recover(post)

                const loadedPost = await dataSource.manager.findOneByOrFail(
                    PostWithDeleteDateColumn,
                    { id: post.id },
                )
                loadedPost.title.should.be.equal("Bakhrom?")
                post.version.should.be.equal(loadedPost.version)
            }),
        ))

    it("soft-remove should not persist changes made outside of listeners", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const post = new PostWithDeleteDateColumn()
                post.title = "Bakhrom"
                post.description = "Hello"
                await dataSource.manager.save(post)
                post.description = "Changed"
                await dataSource.manager.softRemove(post)

                const loadedPost = await dataSource.manager.findOneOrFail(
                    PostWithDeleteDateColumn,
                    { where: { id: post.id }, withDeleted: true },
                )
                loadedPost.title.should.be.equal("Bakhrom!")
                loadedPost.description.should.be.equal("Hello")
            }),
        ))

    it("soft-remove listeners should persist in-place changes to an already changed object value", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const post = new PostWithDeleteDateColumn()
                post.title = "Bakhrom"
                post.description = "Hello"
                post.tags = ["a"]
                await dataSource.manager.save(post)
                post.tags = ["a", "b"]
                await dataSource.manager.softRemove(post)

                const loadedPost = await dataSource.manager.findOneOrFail(
                    PostWithDeleteDateColumn,
                    { where: { id: post.id }, withDeleted: true },
                )
                expect(loadedPost.tags).to.eql(["a", "b", "soft-removed"])
            }),
        ))

    it("soft-remove listener changes should not be persisted for an already soft-removed entity", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const post = new PostWithDeleteDateColumn()
                post.title = "Bakhrom"
                post.description = "Hello"
                await dataSource.manager.save(post)
                await dataSource.manager.softRemove(post, { listeners: false })
                const softRemovedPost = await dataSource.manager.findOneOrFail(
                    PostWithDeleteDateColumn,
                    { where: { id: post.id }, withDeleted: true },
                )
                await dataSource.manager.softRemove(post)

                const loadedPost = await dataSource.manager.findOneOrFail(
                    PostWithDeleteDateColumn,
                    { where: { id: post.id }, withDeleted: true },
                )
                loadedPost.should.be.eql(softRemovedPost)
            }),
        ))
})

describe("persistence > persistence options > listeners > subscribers", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [PostWithDeleteDateColumn],
            subscribers: [PostWithDeleteDateColumnSubscriber],
            disabledDrivers: ["spanner"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    // GitHub issue #9155 - changes made in soft-remove and recover listeners were not persisted
    it("soft-remove subscriber should persist entity changes", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const post = new PostWithDeleteDateColumn()
                post.title = "Bakhrom"
                post.description = "Hello"
                await dataSource.manager.save(post)
                await dataSource.manager.softRemove(post)

                const loadedPost = await dataSource.manager.findOneOrFail(
                    PostWithDeleteDateColumn,
                    { where: { id: post.id }, withDeleted: true },
                )
                loadedPost.description.should.be.equal("Soft-removed")
                loadedPost.title.should.be.equal("Bakhrom!")
                loadedPost.deletedAt.should.be.instanceOf(Date)
            }),
        ))
})
