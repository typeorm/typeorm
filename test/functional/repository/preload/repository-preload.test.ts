import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../../src/data-source/DataSource"
import "../../../utils/test-setup"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { Author } from "./entity/Author"
import { Category } from "./entity/Category"
import { Post } from "./entity/Post"

describe("repository > preload", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Author, Category, Post],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    async function createPost(dataSource: DataSource) {
        const author = new Author()
        author.name = "Timber"
        await dataSource.manager.save(author)

        const post = new Post()
        post.title = "About eager relations"
        post.author = author
        await dataSource.manager.save(post)

        const category = new Category()
        category.name = "typeorm"
        category.post = post
        category.author = author
        await dataSource.manager.save(category)

        return { author, category, post }
    }

    // https://github.com/typeorm/typeorm/issues/8944
    it("should load eager relations of the preloaded entity", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const { post } = await createPost(dataSource)

                const preloadedPost = await dataSource.manager.preload(Post, {
                    id: post.id,
                    title: "Updated title",
                })

                expect(preloadedPost).to.be.instanceOf(Post)
                expect(preloadedPost!.title).to.be.equal("Updated title")

                expect(preloadedPost!.categories).to.have.length(1)
                expect(preloadedPost!.categories[0].name).to.be.equal("typeorm")

                expect(preloadedPost!.author).to.not.be.undefined
                expect(preloadedPost!.author.name).to.be.equal("Timber")
            }),
        ))

    // https://github.com/typeorm/typeorm/issues/8944
    it("should load eager relations of the entities given in the plain object", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const { category, post } = await createPost(dataSource)

                const preloadedPost = await dataSource.manager.preload(Post, {
                    id: post.id,
                    categories: [{ id: category.id, name: "renamed" }],
                })

                expect(preloadedPost!.categories).to.have.length(1)
                expect(preloadedPost!.categories[0].name).to.be.equal("renamed")
                expect(preloadedPost!.categories[0].author).to.not.be.undefined
                expect(preloadedPost!.categories[0].author.name).to.be.equal(
                    "Timber",
                )
            }),
        ))

    it("should not duplicate eagerly loaded relations given in the plain object", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const { category, post } = await createPost(dataSource)

                const secondCategory = new Category()
                secondCategory.name = "orm"
                secondCategory.post = post
                await dataSource.manager.save(secondCategory)

                const preloadedPost = await dataSource.manager.preload(Post, {
                    id: post.id,
                    categories: [{ id: category.id }],
                })

                expect(preloadedPost!.categories).to.have.length(2)
                expect(
                    preloadedPost!.categories.map((it) => it.id).sort(),
                ).to.be.eql([category.id, secondCategory.id].sort())
            }),
        ))
})
