import "reflect-metadata"
import type { DataSource } from "../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { Post } from "./entity/Post"
import { expect } from "chai"

describe("persistence > null and default behaviour", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should insert value if it is set", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                // create category
                const post = new Post()
                post.id = 1
                post.title = "Category saved!"
                await dataSource.manager.save(post)

                const loadedPost = await dataSource.manager.findOneByOrFail(
                    Post,
                    {
                        id: 1,
                    },
                )
                expect(loadedPost).to.exist
                loadedPost.should.be.eql({
                    id: 1,
                    title: "Category saved!",
                })
            }),
        ))

    it("should insert default when post.title is undefined", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                // create category
                const post = new Post()
                post.id = 1
                await dataSource.manager.save(post)

                const loadedPost = await dataSource.manager.findOneByOrFail(
                    Post,
                    {
                        id: 1,
                    },
                )
                expect(loadedPost).to.exist
                loadedPost.should.be.eql({
                    id: 1,
                    title: "hello default value",
                })
            }),
        ))

    it("should insert NULL when post.title is null", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                // create category
                const post = new Post()
                post.id = 1
                post.title = null
                await dataSource.manager.save(post)

                const loadedPost = await dataSource.manager.findOneByOrFail(
                    Post,
                    {
                        id: 1,
                    },
                )
                expect(loadedPost).to.exist
                loadedPost.should.be.eql({
                    id: 1,
                    title: null,
                })
            }),
        ))

    it("should update nothing when post.title is undefined", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                // create category
                const post = new Post()
                post.id = 1
                post.title = "Category saved!"
                await dataSource.manager.save(post)

                post.title = undefined
                await dataSource.manager.save(post)

                const loadedPost = await dataSource.manager.findOneByOrFail(
                    Post,
                    {
                        id: 1,
                    },
                )
                expect(loadedPost).to.exist
                loadedPost.should.be.eql({
                    id: 1,
                    title: "Category saved!",
                })
            }),
        ))

    it("should update to null when post.title is null", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const post = new Post()
                post.id = 1
                post.title = "Category saved!"
                await dataSource.manager.save(post)

                post.title = null
                await dataSource.manager.save(post)

                const loadedPost = await dataSource.manager.findOneByOrFail(
                    Post,
                    {
                        id: 1,
                    },
                )
                expect(loadedPost).to.exist
                loadedPost.should.be.eql({
                    id: 1,
                    title: null,
                })
            }),
        ))
})
