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
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should insert value if it is set", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                // create category
                const post = new Post()
                post.id = 1
                post.title = "Category saved!"
                await connection.manager.save(post)

                const loadedPost = await connection.manager.findOneBy(Post, {
                    id: 1,
                })
                expect(loadedPost).to.exist
                loadedPost!.should.be.eql({
                    id: 1,
                    title: "Category saved!",
                })
            }),
        ))

    it("should insert default when post.title is undefined", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                // create category
                const post = new Post()
                post.id = 1
                await connection.manager.save(post)

                const loadedPost = await connection.manager.findOneBy(Post, {
                    id: 1,
                })
                expect(loadedPost).to.exist
                loadedPost!.should.be.eql({
                    id: 1,
                    title: "hello default value",
                })
            }),
        ))

    it("should insert NULL when post.title is null", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                // create category
                const post = new Post()
                post.id = 1
                post.title = null
                await connection.manager.save(post)

                const loadedPost = await connection.manager.findOneBy(Post, {
                    id: 1,
                })
                expect(loadedPost).to.exist
                loadedPost!.should.be.eql({
                    id: 1,
                    title: null,
                })
            }),
        ))

    it("should update nothing when post.title is undefined", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                // create category
                const post = new Post()
                post.id = 1
                post.title = "Category saved!"
                await connection.manager.save(post)

                post.title = undefined
                await connection.manager.save(post)

                const loadedPost = await connection.manager.findOneBy(Post, {
                    id: 1,
                })
                expect(loadedPost).to.exist
                loadedPost!.should.be.eql({
                    id: 1,
                    title: "Category saved!",
                })
            }),
        ))

    it("should update to null when post.title is null", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const post = new Post()
                post.id = 1
                post.title = "Category saved!"
                await connection.manager.save(post)

                post.title = null
                await connection.manager.save(post)

                const loadedPost = await connection.manager.findOneBy(Post, {
                    id: 1,
                })
                expect(loadedPost).to.exist
                loadedPost!.should.be.eql({
                    id: 1,
                    title: null,
                })
            }),
        ))
})
