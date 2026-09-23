import "reflect-metadata"
import { expect } from "chai"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import type { DataSource } from "../../../../src/data-source/DataSource"
import { Counters, Post } from "./entity/Post"

describe("columns > select-control", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Post],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should not select columns marked with select: false option", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const postRepository = dataSource.getRepository(Post)

                // create and save a post first
                const post = new Post()
                post.title = "About columns"
                post.text = "Some text about columns"
                post.authorName = "Umed"
                await postRepository.save(post)

                // check if all columns are updated except for readonly columns
                const loadedPost = await postRepository.findOneByOrFail({
                    id: post.id,
                })
                expect(loadedPost.title).to.be.equal("About columns")
                expect(loadedPost.text).to.be.equal("Some text about columns")
                expect(loadedPost.authorName).to.be.undefined
            }),
        ))

    it("should not select columns with QueryBuilder marked with select: false option", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const postRepository = dataSource.getRepository(Post)

                // create and save a post first
                const post = new Post()
                post.title = "About columns"
                post.text = "Some text about columns"
                post.authorName = "Umed"
                await postRepository.save(post)

                // check if all columns are updated except for readonly columns
                const loadedPost = await postRepository
                    .createQueryBuilder("post")
                    .where("post.id = :id", { id: post.id })
                    .getOneOrFail()
                expect(loadedPost.title).to.be.equal("About columns")
                expect(loadedPost.text).to.be.equal("Some text about columns")
                expect(loadedPost.authorName).to.be.undefined
            }),
        ))

    it("should select columns with select: false even columns were implicitly selected", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const postRepository = dataSource.getRepository(Post)

                // create and save a post first
                const post = new Post()
                post.title = "About columns"
                post.text = "Some text about columns"
                post.authorName = "Umed"
                await postRepository.save(post)

                // check if all columns are updated except for readonly columns
                const loadedPost = await postRepository
                    .createQueryBuilder("post")
                    .addSelect("post.authorName")
                    .where("post.id = :id", { id: post.id })
                    .getOneOrFail()
                expect(loadedPost.title).to.be.equal("About columns")
                expect(loadedPost.text).to.be.equal("Some text about columns")
                expect(loadedPost.authorName).to.be.equal("Umed")
            }),
        ))

    it("should preserve user-supplied values for select: false columns on the entity returned by save()", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const postRepository = dataSource.getRepository(Post)
                const post = new Post()
                post.title = "Hello Post"
                post.text = "Some text"
                post.authorName = "Umed"
                const savedPost = await postRepository.save(post)

                expect(savedPost).to.have.property("id")
                expect(savedPost).to.have.property("title")
                expect(savedPost.authorName).to.be.equal("Umed")
                // and the original reference must not be mutated either
                expect(post.authorName).to.be.equal("Umed")
            }),
        ))

    it("should preserve user-supplied values for select: false columns in embedded entities on save()", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const postRepository = dataSource.getRepository(Post)
                const post = new Post()
                post.title = "Hello Post"
                post.text = "Some text"
                post.authorName = "Umed"
                post.counters = new Counters()
                post.counters.secretCode = "789"
                const savedPost = await postRepository.save(post)

                expect(savedPost).to.have.property("id")
                expect(savedPost).to.have.property("title")
                expect(savedPost.authorName).to.be.equal("Umed")
                expect(savedPost.counters.secretCode).to.be.equal("789")
                expect(post.counters.secretCode).to.be.equal("789")
            }),
        ))
})
