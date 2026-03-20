import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../../src/data-source/DataSource"
import "../../../utils/test-setup"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { Post } from "./entity/Post"

describe("repository > findOrCreate", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Post],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should create entity when it does not exist", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const postRepository = dataSource.getRepository(Post)

                const [post, created] = await postRepository.findOrCreate({
                    where: { title: "New Post" },
                    create: { text: "Post content" },
                })

                expect(created).to.be.true
                expect(post).to.be.instanceOf(Post)
                expect(post.title).to.equal("New Post")
                expect(post.text).to.equal("Post content")
                expect(post.id).to.exist
            }),
        ))

    it("should find existing entity without creating a duplicate", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const postRepository = dataSource.getRepository(Post)

                // Create a post first
                const existingPost = new Post()
                existingPost.title = "Existing Post"
                existingPost.text = "Existing content"
                await postRepository.save(existingPost)

                const [post, created] = await postRepository.findOrCreate({
                    where: { title: "Existing Post" },
                    create: { text: "This should not be used" },
                })

                expect(created).to.be.false
                expect(post.id).to.equal(existingPost.id)
                expect(post.title).to.equal("Existing Post")
                expect(post.text).to.equal("Existing content")

                // Verify no duplicate was created
                const allPosts = await postRepository.find()
                expect(allPosts).to.have.length(1)
            }),
        ))

    it("should merge where and create fields correctly on creation", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const postRepository = dataSource.getRepository(Post)

                const [post, created] = await postRepository.findOrCreate({
                    where: { title: "Merged Post" },
                    create: { text: "Merged text" },
                })

                expect(created).to.be.true
                expect(post.title).to.equal("Merged Post")
                expect(post.text).to.equal("Merged text")
            }),
        ))

    it("should work without create option", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const postRepository = dataSource.getRepository(Post)

                const [post, created] = await postRepository.findOrCreate({
                    where: { title: "No Create Option" },
                })

                expect(created).to.be.true
                expect(post.title).to.equal("No Create Option")
                expect(post.text).to.be.null
            }),
        ))

    it("should not allow create to override where values", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const postRepository = dataSource.getRepository(Post)

                const [post, created] = await postRepository.findOrCreate({
                    where: { title: "Correct Title" },
                    create: { title: "Wrong Title" as any, text: "Some text" },
                })

                expect(created).to.be.true
                // where should take precedence over create for overlapping keys
                expect(post.title).to.equal("Correct Title")
                expect(post.text).to.equal("Some text")

                // second call should find the existing entity
                const [post2, created2] = await postRepository.findOrCreate({
                    where: { title: "Correct Title" },
                })

                expect(created2).to.be.false
                expect(post2.id).to.equal(post.id)
            }),
        ))

    it("should work via EntityManager API", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const manager = dataSource.manager

                const [post, created] = await manager.findOrCreate(Post, {
                    where: { title: "Manager Post" },
                    create: { text: "Manager content" },
                })

                expect(created).to.be.true
                expect(post).to.be.instanceOf(Post)
                expect(post.title).to.equal("Manager Post")
                expect(post.text).to.equal("Manager content")

                // Second call should find existing
                const [post2, created2] = await manager.findOrCreate(Post, {
                    where: { title: "Manager Post" },
                })

                expect(created2).to.be.false
                expect(post2.id).to.equal(post.id)
            }),
        ))
})
